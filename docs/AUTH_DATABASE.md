# Authentification et données — TrippieMe

## Choix retenu

- **Neon Postgres** : offre gratuite, connexion HTTP adaptée aux fonctions Vercel.
- **Drizzle ORM** : schéma TypeScript versionné et migrations SQL explicites.
- **Better Auth** : comptes email/mot de passe, sessions sécurisées via cookies HTTP-only.

## Données persistées

| Donnée | Table | Propriétaire |
| --- | --- | --- |
| Compte | `user` | Better Auth |
| Session | `session` | Better Auth |
| Identité / mot de passe | `account` | Better Auth |
| Jetons de vérification | `verification` | Better Auth |
| Itinéraire complet | `trip` | Utilisateur connecté |

L’API `/api/trips` vérifie la session Better Auth et filtre systématiquement par `user_id`. Aucun utilisateur ne peut lire, modifier ou supprimer le voyage d’un autre.

## Limites assumées du premier lot

- L’inscription email/mot de passe est active ; la vérification d’email et la réinitialisation de mot de passe exigent un fournisseur d’envoi d’email, qui n’est pas ajouté sans choix de produit.
- Les anciens itinéraires locaux restent disponibles comme secours. Après connexion, les modifications sont aussi synchronisées sur Neon.
- Les migrations sont générées par Drizzle et lancées hors build Vercel pour éviter toute course entre déploiements.
