document.addEventListener('DOMContentLoaded', () => {
  const signUpTeacherCta = document.querySelector('.hero-cta .btn.btn-primary');
  if (!signUpTeacherCta) return;

  signUpTeacherCta.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = './pages/teacherOrStudent.html';
  });
});
