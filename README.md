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

# Rajout des fonctionalités
### Fait en Pair Programming avec Alexandre Morel.
## Utilisateurs et stockage des messages
* Connaître quels sont les utilisateurs connectés et les afficher (en utilisant Redis) :white_check_mark:
* Stocker l'ensemble des messages dans MongoDB :white_check_mark:
## Replicaset
* Utiliser le ReplicaSet pour permettre une meilleure tolérance aux pannes.:white_check_mark:

Nous allons créer 1 serveur primary et deux serveurs secondary qui vont permettrent la replication des données.
Pour ce faire on créer 3 dossiers R0S1, R0S2 , R0S3 dans le repertoire data.
Ensuite on effectue les commandes suivante pour lancer les replicaset sur différents port.

` mongod --replSet rs0 --port 27018 --dbpath ./data/R0S1`

`mongod --replSet rs0 --port 27019 --dbpath ./data/R0S2`

`mongod --replSet rs0 --port 27020 --dbpath ./data/R0S3`.

On se connecte ensuite au port `27018` qui est le serveur principale pour connecter les replicasets

Ensuite on initialise le replicaset : `rs.initiate()`
On ajoute les replicasets: `rs.add(‘localhost :27020’)`.

Pour finir on créer un serveur arbitre qui va élire le serveur primary. On evite les temps de latences de l'élection

`mongod --replSet rs0 --port 3000 --dbpath ./data/arb`
il suffit d’exécuter la commande `rs.addArb(‘localhost :3000’)` dans le client mongo. Dès cet instant, l’arbitre élit le primary et les deux secondary.

## Quelques Requêtes
* Quelques requêtes basiques comme récuperer les messages, les messages de chaque utilisateurs, compter les messages de chaques utilisateurs...Elles sont visible dans le code  :white_check_mark:
* Pouvoir afficher les dix messages précedents.  :white_check_mark:
* Sortir celui qui communique le plus. :white_check_mark:
* Mode de stockage des messages ephémère avec le stockage des messages dans REDIS avec un Timeout. :white_check_mark:
![image](https://user-images.githubusercontent.com/49042749/113753180-17d36b80-970e-11eb-9744-4c7739bc912d.png)



