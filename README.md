# Socket.io : Chat

Ce tutoriel est lui même une adaptation du [tutoriel officiel](http://socket.io/get-started/chat/) de socket.io.

Cette version ajoute les fonctionnalités suivantes par rapport à la version du tutoriel officiel :

* Support des noms d'utilisateurs
* Affichage d'un message lors de la connexion/déconnexion d'un utilisateur
* Affichage de la liste des utilisateurs connectés
* Conservation d'un historique des messages
* Affichage du texte "typing" à côté du nom des utilisateurs en train de saisir un message


## Installation

Si vous n'avez pas bower d'installé sur votre machine, installez-le au préalable de la façon suivante :
```
npm install -g bower
```

Pour installer l'application, téléchargez les sources (zip ou git clone) et exécutez la commande suivante depuis la racine du projet.
```
npm install
bower install
```

## Démarrer l'application

Pour démarrer l'application, exécutez la commande suivante depuis la racine du projet.
```
node server
```

L'application est désormais accesssible à l'url **http://localhost:8001/**.

# Rajout de fonctionalité
## Utilisateurs et stockage des messages
* Connaître quels sont les utilisateurs connectés et les afficher (en utilisant Redis) [ ] Jupiter
* Stocker l'ensemble des messages dans MongoDB [ ] Jupiter

## Replicaset
* Utiliser le ReplicaSet pour permettre une meilleure tolérance aux pannes.

Nous allons créer 1 serveur primary et deux serveurs secondary qui vont permettrent la replication des données.
Pour ce faire on créer 3 dossiers R0S1, R0S2 , R0S3 dans le repertoire data.
Ensuite on effectue les commandes suivante pour lancer les replicaset sur différents port.

mongod --replSet rs0 --port 27018 --dbpath ./data/R0S1

mongod --replSet rs0 --port 27019 --dbpath ./data/R0S2

mongod --replSet rs0 --port 27020 --dbpath ./data/R0S3
on se connect ensuite au port 27018 qui est le serveur principale pour connecter les replicasets

Ensuite on initialise le replicaset : rs.initiate()
On ajoute les replicasets: rs.add(‘localhost :27020’)

Pour finir on créer un serveur arbitre qui va élire le serveur primary. On evite les temps de latences de l'élection

mongod --replSet rs0 --port 3000 --dbpath ./data/arb
il suffit d’exécuter la commande rs.addArb(‘localhost :3000’) dans le client mongo. Dès cet instant, l’arbitre élit le primary et les deux secondary.

## Quelques Requêtes
* Pouvoir afficher une conversation précédente entre deux utilisateurs
* Sortir des requêtes pertinentes : utilisateur le plus sollicité, celui qui communique le plus, etc.
