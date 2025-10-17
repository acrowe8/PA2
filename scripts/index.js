
document.addEventListener('DOMContentLoaded', () => {
  const signUpTeacherCta = document.querySelector('.hero-cta .btn.btn-primary');
  if (!signUpTeacherCta) return;

  signUpTeacherCta.addEventListener('click', (event) => {
    // If the link already points to choose-role, allow default
    const href = signUpTeacherCta.getAttribute('href') || '';
    if (href.includes('choose-role.html')) return;
    event.preventDefault();
    window.location.href = './pages/choose-role.html';
  });
});
