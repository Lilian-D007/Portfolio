// Ouvre/ferme les menus au TAP (sur mobile). Sur PC, le :hover du CSS suffit.
document.addEventListener('DOMContentLoaded', () => {
  const ids = ['dd-projets', 'dd-tp'];
  ids.forEach(id => {
    const dd = document.getElementById(id);
    if(!dd) return;
    const toggle = dd.querySelector('.dd-toggle');
    if(!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();                   // on ne navigue pas en cliquant sur le libellé
      // ferme l'autre dropdown si ouvert
      document.querySelectorAll('.dd').forEach(other => {
        if (other !== dd) other.classList.remove('open');
      });
      dd.classList.toggle('open');          // ouvre/ferme celui-ci
    });
  });

  // clic ailleurs -> ferme
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dd')) {
      document.querySelectorAll('.dd.open').forEach(dd => dd.classList.remove('open'));
    }
  });
});
