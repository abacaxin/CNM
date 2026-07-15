document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  const service = window.CNMFirebase;

  if (!service.configured) {
    message.textContent = 'Configure o Firebase em firebase-config.js antes de entrar.';
    return;
  }

  service.auth().onAuthStateChanged(async (user) => {
    if (user && await service.isAdmin(user)) window.location.replace('admin.html');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const credential = await service.auth().signInWithEmailAndPassword(email, password);
      if (!await service.isAdmin(credential.user)) {
        await service.auth().signOut();
        throw new Error('Esta conta não possui autorização administrativa.');
      }
      window.location.replace('admin.html');
    } catch (error) {
      message.textContent = error.message === 'Esta conta não possui autorização administrativa.'
        ? error.message : 'Não foi possível entrar. Confira seu e-mail e senha.';
    } finally {
      button.disabled = false;
    }
  });
});
