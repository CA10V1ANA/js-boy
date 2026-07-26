import { PerfilAcesso } from '../types';

export function normalizePerfil(perfil: PerfilAcesso): Exclude<PerfilAcesso, 'FUNCIONARIO'> {
  return perfil === 'FUNCIONARIO' ? 'ENTREGADOR' : perfil;
}

export function roleHomePath(perfil: PerfilAcesso) {
  return switchHome(normalizePerfil(perfil));
}

function switchHome(perfil: Exclude<PerfilAcesso, 'FUNCIONARIO'>) {
  switch (perfil) {
    case 'PROPRIETARIO':
      return '/dashboard';
    case 'ENTREGADOR':
      return '/minhas-entregas';
    case 'CLIENTE':
      return '/portal';
  }
}
