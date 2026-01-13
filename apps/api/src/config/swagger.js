/**
 * @fileoverview Swagger/OpenAPI Configuration - Phase 3.7
 *
 * This file configures Swagger UI for API documentation.
 * Provides interactive documentation for all REST endpoints.
 *
 * Features:
 * - Auto-generated API documentation from JSDoc comments
 * - Interactive testing interface (Swagger UI)
 * - Authentication support (JWT Bearer tokens)
 * - Request/Response examples
 * - Schema definitions
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Swagger definition
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Inventaire SI - API Documentation',
    version: '0.7.9',
    description: `
API REST pour la gestion d'inventaire IT avec suivi des prêts.

## Fonctionnalités principales

- 📦 **Gestion des équipements** : Modèles et articles d'équipement
- 👥 **Gestion des employés** : Base de données employés
- 📋 **Gestion des prêts** : Prêts d'équipements avec signatures
- 📊 **Stock consommable** : Articles consommables avec quantités
- 🔐 **Authentification** : JWT access/refresh tokens
- 📈 **Dashboard** : Statistiques en temps réel
- 📤 **Exports** : Export Excel des données

## Authentification

La plupart des endpoints nécessitent un token JWT.

1. Utilisez \`POST /api/auth/login\` pour obtenir un access token
2. Cliquez sur "Authorize" en haut de cette page
3. Entrez: \`Bearer <votre_token>\`
4. Testez les endpoints protégés

## Performances

- ⚡ **Cache Redis** : Dashboard et listes (5-15min TTL)
- 🗜️ **Compression gzip** : Réduction 75% de la bande passante
- 📦 **Pagination** : Tous les endpoints de liste
- 🔄 **Cache HTTP** : En-têtes intelligents par type d'endpoint

## Rôles utilisateurs

- **ADMIN** : Accès complet (lecture + écriture + suppression)
- **GESTIONNAIRE** : Gestion des prêts et équipements
- **LECTURE** : Consultation uniquement
    `,
    contact: {
      name: 'Support Technique',
      email: 'support@groupetilly.com',
    },
    license: {
      name: 'Propriétaire',
      url: 'https://groupetilly.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Serveur de développement',
    },
    {
      url: 'http://localhost:3001',
      description: 'Serveur de staging',
    },
    {
      url: 'https://api.inventaire.groupetilly.com',
      description: 'Serveur de production',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentification et gestion des tokens',
    },
    {
      name: 'Users',
      description: 'Gestion des utilisateurs système',
    },
    {
      name: 'Employees',
      description: 'Gestion des employés',
    },
    {
      name: 'Asset Models',
      description: 'Modèles d\'équipement (templates)',
    },
    {
      name: 'Asset Items',
      description: 'Articles d\'équipement individuels',
    },
    {
      name: 'Stock Items',
      description: 'Articles consommables (stock)',
    },
    {
      name: 'Loans',
      description: 'Prêts d\'équipements',
    },
    {
      name: 'Dashboard',
      description: 'Statistiques et tableau de bord',
    },
    {
      name: 'Export',
      description: 'Export Excel des données',
    },
    {
      name: 'Health',
      description: 'Endpoints de santé et monitoring',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via /api/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Message d\'erreur',
            example: 'Ressource non trouvée',
          },
          details: {
            type: 'object',
            description: 'Détails additionnels (optionnel)',
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Numéro de page actuelle',
            example: 1,
          },
          pageSize: {
            type: 'integer',
            description: 'Nombre d\'éléments par page',
            example: 20,
          },
          totalItems: {
            type: 'integer',
            description: 'Nombre total d\'éléments',
            example: 156,
          },
          totalPages: {
            type: 'integer',
            description: 'Nombre total de pages',
            example: 8,
          },
          hasNextPage: {
            type: 'boolean',
            description: 'Y a-t-il une page suivante?',
            example: true,
          },
          hasPreviousPage: {
            type: 'boolean',
            description: 'Y a-t-il une page précédente?',
            example: false,
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Non authentifié - Token manquant ou invalide',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Token manquant ou invalide',
            },
          },
        },
      },
      Forbidden: {
        description: 'Accès refusé - Permissions insuffisantes',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Accès refusé. Permissions insuffisantes.',
            },
          },
        },
      },
      NotFound: {
        description: 'Ressource non trouvée',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Ressource non trouvée',
            },
          },
        },
      },
      ValidationError: {
        description: 'Erreur de validation des données',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Données invalides',
              details: {
                email: 'Email invalide',
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

/**
 * Options for swagger-jsdoc
 */
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    join(__dirname, '../routes/*.js'),
    join(__dirname, '../controllers/*.js'),
    join(__dirname, '../models/*.js'),
  ],
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
