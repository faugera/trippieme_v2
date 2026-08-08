# CI/CD — TrippieMe

Dernière mise à jour : 8 août 2026.

## État vérifié

| Élément | Valeur |
| --- | --- |
| Vercel team | `faugeras-projects` |
| Projet Vercel | `trippieme-london` (`prj_bzIqjlW2BM0YJ05tpElcMheAha2M`) |
| Production | [trippieme-london.vercel.app](https://trippieme-london.vercel.app) |
| Runtime Node configuré | `24.x` |
| Dernier déploiement vu | `READY`, cible `production` |
| Dépôt attendu | `faugera/trippieme_v2` |
| État GitHub constaté | Le guide CI/CD est présent ; le code source applicatif reste à synchroniser. |

## Flux cible recommandé

Vercel Git Integration suffit pour ce projet Next.js : aucun workflow GitHub Actions de déploiement n’est nécessaire.

```mermaid
flowchart LR
  A[Branche fonctionnalité] --> B[Pull request GitHub]
  B --> C[Preview Vercel]
  C --> D{lint + build OK ?}
  D -->|Oui| E[Merge vers main]
  D -->|Non| A
  E --> F[Production Vercel]
```

1. Initialiser et pousser ce code dans `faugera/trippieme_v2`.
2. Dans Vercel > **trippieme-london** > Settings > Git, connecter ce dépôt et définir `main` comme branche de production.
3. Exiger une pull request avant merge vers `main` dans les règles GitHub.
4. Vérifier l’URL Preview créée par Vercel à chaque pull request.
5. Fusionner uniquement après les contrôles ci-dessous ; Vercel crée alors le déploiement de production automatiquement.

## Contrôles obligatoires avant merge

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Le build Vercel doit utiliser `npm run build`. Les routes IA exigent une variable serveur présente dans chaque environnement nécessaire.

## Variables d’environnement Vercel

| Variable | Requise | Portée | Usage |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Oui | Preview + Production | Génération et modification d’itinéraires |
| `GEMINI_MODEL` | Non | Preview + Production | Surcharge du modèle ; défaut : `gemini-2.5-flash` |

Ne jamais les committer, les coller dans un ticket, ni les exposer via `NEXT_PUBLIC_*`.

## Exploitation et rollback

| Besoin | Action |
| --- | --- |
| Vérifier la production | Ouvrir l’URL de production et contrôler le déploiement `READY` dans Vercel |
| Lire erreurs API | Vercel > Observability > Runtime Errors, filtrer `/api/trips/generate` et `/api/trips/edit` |
| Tester sans risque | Utiliser l’URL Preview d’une pull request |
| Revenir en arrière | Vercel > Deployments > choisir le dernier déploiement sain > **Promote to Production** |
| Révoquer une clé | Google AI Studio, puis remplacer la variable Vercel et redéployer |

## Écart à fermer

Le code source applicatif n’est pas encore présent dans le dépôt. Tant qu’il n’y est pas poussé et que Vercel n’est pas connecté à `main`, les déploiements restent manuels et ne constituent pas un CI/CD fiable.
