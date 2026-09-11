param(
  [Parameter(Mandatory=$true)][string]$ApiUrl,
  [Parameter(Mandatory=$true)][string]$AdminEmail,
  [Parameter(Mandatory=$true)][string]$AdminPassword,
  [int]$ClientCount = 12,
  [int]$DriverCount = 6,
  [int]$DeliveryCount = 120,
  [string]$RunId = "$(Get-Date -Format yyyyMMddHHmmss)"
)
$ErrorActionPreference = 'Stop'
$auth = Invoke-RestMethod -Method Post -Uri "$ApiUrl/auth/login" -ContentType 'application/json' -Body (@{email=$AdminEmail;senha=$AdminPassword}|ConvertTo-Json)
$headers = @{Authorization="Bearer $($auth.token)"}
function PostJson($path,$body,$extra=@{}) { Invoke-RestMethod -Method Post -Uri "$ApiUrl$path" -Headers ($headers+$extra) -ContentType 'application/json' -Body ($body|ConvertTo-Json -Depth 6) }
function PatchStatus($item,$status) {
  Invoke-RestMethod -Method Patch -Uri "$ApiUrl/entregas/$($item.id)/status" -Headers ($headers+@{'If-Match'="$($item.versao)"}) -SkipHeaderValidation -ContentType 'application/json' -Body (@{status=$status}|ConvertTo-Json) | Out-Null
  Invoke-RestMethod -Method Get -Uri "$ApiUrl/entregas/$($item.id)" -Headers $headers
}
function New-TestCpf([int]$seed) {
  $base=(700000000+$seed).ToString('000000000'); $digits=@($base.ToCharArray()|ForEach-Object {[int]::Parse($_)})
  $sum=0; for($j=0;$j -lt 9;$j++) {$sum += $digits[$j]*(10-$j)}; $remainder=$sum%11; $digit1=$(if($remainder-lt 2){0}else{11-$remainder}); $digits += $digit1
  $sum=0; for($j=0;$j -lt 10;$j++) {$sum += $digits[$j]*(11-$j)}; $remainder=$sum%11; $digit2=$(if($remainder-lt 2){0}else{11-$remainder})
  "$base$digit1$digit2"
}
$runDigits=($RunId-replace '\D',''); if($runDigits.Length-lt 4){$runDigits=$runDigits.PadLeft(4,'0')}; $runSuffix=$runDigits.Substring($runDigits.Length-4)
$existingClients=Invoke-RestMethod -Method Get -Uri "$ApiUrl/clientes" -Headers $headers; $existingClients=@($existingClients)
$clients=@(); for($i=1;$i -le $ClientCount;$i++) {
  $name="TESTE CARGA 30D $RunId CLIENTE $i"; $existing=$existingClients|Where-Object {$_.nome-eq$name}|Select-Object -First 1
  if($existing){$clients += $existing; continue}
  $clients += PostJson '/clientes' @{
  nome=$name; telefone="8598$runSuffix$($i.ToString('000'))"; whatsapp=''; email="carga.$RunId.$i@example.com"; documento=$null;
  endereco="Rua Homologacao $i, 100"; bairro='Aldeota'; cidade='Fortaleza'; observacoes="TESTE CARGA 30D $RunId"; cep='60175055'; logradouro="Rua Homologacao $i"; numero='100'; complemento=''; estado='CE'; semNumero=$false
} }
$existingDrivers=Invoke-RestMethod -Method Get -Uri "$ApiUrl/entregadores" -Headers $headers; $existingDrivers=@($existingDrivers)
$drivers=@(); for($i=1;$i -le $DriverCount;$i++) {
  $name="TESTE CARGA 30D $RunId ENTREGADOR $i"; $existing=$existingDrivers|Where-Object {$_.nome-eq$name}|Select-Object -First 1
  if($existing){$drivers += $existing; continue}
  $drivers += PostJson '/entregadores' @{
  nome=$name; cpf=(New-TestCpf (1000+$i)); telefone="8597$runSuffix$($i.ToString('000'))"; email="motorista.$RunId.$i@example.com"; tipoVeiculo=$(if($i%3-eq 0){'CARRO'}else{'MOTO'}); placaVeiculo="TST$($i.ToString('0'))A$($i.ToString('00'))"; disponivel=$true
} }
$existingDeliveries=Invoke-RestMethod -Method Get -Uri "$ApiUrl/entregas" -Headers $headers; $existingDeliveries=@($existingDeliveries|Where-Object {$_.observacoes-eq"TESTE CARGA 30D $RunId"})
$existingPayments=Invoke-RestMethod -Method Get -Uri "$ApiUrl/pagamentos" -Headers $headers; $existingPayments=@($existingPayments)
$deliveries=@(); $latencies=@(); for($i=1;$i -le $DeliveryCount;$i++) {
  $client=$clients[($i-1)%$clients.Count]; $driver=$drivers[($i-1)%$drivers.Count]; $watch=[Diagnostics.Stopwatch]::StartNew()
  $item=$existingDeliveries|Where-Object {$_.descricaoMercadoria-eq"Volume teste $i"}|Sort-Object criadoEm|Select-Object -First 1
  if(-not $item){$item=PostJson '/entregas' @{clienteId=$client.id;entregadorId=$(if($i%6-eq 0){$null}else{$driver.id});enderecoOrigem="Origem teste $i";bairroOrigem='Aldeota';enderecoDestino="Destino teste $i";bairroDestino='Cocó';destinatarioNome="TESTE DESTINATARIO $i";destinatarioTelefone='85999990000';descricaoMercadoria="Volume teste $i";observacoes="TESTE CARGA 30D $RunId";distanciaKm=5+($i%12);valorFinal=15+($i%35);observacaoValorManual='Simulacao mensal';tipoVeiculo=$(if($i%5-eq 0){'CARRO'}else{'MOTO'});tempoEsperaMinutos=($i%4)*15;possuiRetorno=($i%7-eq 0);valorNegociado=$null}}
  $watch.Stop(); $latencies += $watch.ElapsedMilliseconds
  if($item.entregadorId) {
    if($i%10-eq 0 -and $item.status-eq'ENTREGADOR_DESIGNADO'){$item=PatchStatus $item 'CANCELADA'}
    elseif($i%4-eq 0){if($item.status-eq'ENTREGADOR_DESIGNADO'){$item=PatchStatus $item 'COLETADA'}; if($item.status-eq'COLETADA'){$item=PatchStatus $item 'EM_ROTA'}}
    elseif($i%3-eq 0 -and $item.status-eq'ENTREGADOR_DESIGNADO'){$item=PatchStatus $item 'COLETADA'}
  }
  $deliveries += $item
  if($i%2-eq 0 -and -not($existingPayments|Where-Object {$_.entregaId-eq$item.id -and $_.observacoes-eq"TESTE CARGA 30D $RunId"})) { $paid=[math]::Round([double]$item.valorFinal * $(if($i%8-eq 0){0.5}else{1}),2); $date=(Get-Date).AddDays(-($i%30)).ToString('o'); PostJson '/pagamentos' @{entregaId=$item.id;valor=$paid;formaPagamento=@('PIX','DINHEIRO','CARTAO','TRANSFERENCIA')[$i%4];pagoEm=$date;comprovante='';observacoes="TESTE CARGA 30D $RunId"} @{'Idempotency-Key'="load-$RunId-$($item.id)"} | Out-Null }
}
$summary=[ordered]@{runId=$RunId;clients=$clients.Count;drivers=$drivers.Count;deliveries=$deliveries.Count;payments=[math]::Floor($DeliveryCount/2);createLatencyMs=[ordered]@{min=($latencies|Measure-Object -Minimum).Minimum;avg=[math]::Round(($latencies|Measure-Object -Average).Average,1);max=($latencies|Measure-Object -Maximum).Maximum}}
$summary|ConvertTo-Json -Depth 4
