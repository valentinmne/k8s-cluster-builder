#  ISR-ORC4

Create a cluster that contain all the basic features of k8s with a secured private registery and a monitoring solution

## Architecture
![alt text](https://cdn.discordapp.com/attachments/773166824774828032/827337458827001876/unknown.png)


## Summary

- [Prerequisite](#prerequisite)
- [Build the cluster](#build-the-cluster)
- [Access to your cluster](#access-to-your-cluster)
- [Calico](#calico-networking)
- [NFS](#nfs-storage)
- [SSL Certificate](#ssl-certificate)
- [Registry Deployment](#create-the-registry-deployment)
- [Registry service](#create-the-registry-service)
- [Test the registry](#test-the-registry)
- [Build docker files](#build-docker-files)
- [Build pods from dockerfiles](#build-pods-from-these-dockerfiles)
- [Monitor your pods with Prometheus](#prometheus-monitoring)
- [Acess to pods from outside](#acess-to-pods-from-outside)

## Prerequisite

Ansible : https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html
Vagrant : https://www.vagrantup.com/downloads
Virtual Box : https://www.virtualbox.org/

## Build the cluster

``` git clone https://rendu-git.etna-alternance.net/module-7671/activity-41896/group-848176```

### These are all the files related to the build section :
```textile
|── roles
│   ├── common
│   │   ├── defaults
│   │   │   └── main.yml
│   │   ├── handlers
│   │   │   └── main.yml
│   │   └── tasks
│   │       └── main.yml
│   ├── main.yml
│   ├── master
│   │   ├── meta
│   │   │   └── main.yml
│   │   └── tasks
│   │       └── main.yml
│   └── worker
│       ├── meta
│       │   └── main.yml
│       └── tasks
│           └── main.yml
└── Vagrantfile
```
In the ```Vagrantfile``` you can set up a bunch of parameters like :
- The Image name
- The Memory that you give to your VM
- The Number of  CPU that you give to your VM
- The Number of workers
- The network base for the nodes
- The network range for the  the pods

By default VM are builded with Virtualbox but you can edit that in the ```Vagrantfile``` and use many other options, you can find them here : https://www.vagrantup.com/docs/providers


In the ```role``` folder you have all the VM software installation (You can modify it as you want) 

#### To start the cluster building, follow these instructions : 
```vagrant up```

Then the Vagrant and Ansible scripts will run according to your configuration
 

## Access to your cluster

Now that your cluster is build you can ssh into it with : ```vagrant ssh master``` to acess to the master node or ```vagrant ssh worker-[ID]``` to access to your workers nodes
## Calico [NETWORKING]

Calico is an open source networking and network security solution for containers, virtual machines, and native host-based workloads. Calico supports a broad range of platforms including Kubernetes, OpenShift, Docker EE, OpenStack, and bare metal services.
This will help us to have an interconnection between pods and use them with a DNS name

####  Setup (On the master Node)

```kubectl create -f https://docs.projectcalico.org/manifests/tigera-operator.yaml```

```kubectl create -f https://docs.projectcalico.org/manifests/custom-resources.yaml```

To see if your pods are OK or have a problem you can run this:

```watch -n 1 kubectl get pods calico-system```

It will update each seconds the status of your pods

### Does Calico work well ?

To verify if Calico is working we are gonna import an image and execute commands into it : 

#### Runing the pod  :  ```kubectl apply -f https://k8s.io/examples/admin/dns/dnsutils.yaml``` 
#### Execute  this to test DNS Resolution : ```kubectl exec -i -t dnsutils -- wget kubernetes```

If you got a response like this ```Connecting to kubernetes (10.96.0.1:80)``` Calico is Working !

Else, you can refer to this DNS troubleshouting documentation : ```https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/``` 



## NFS [STORAGE]

Here we will create persistent volumes for our registery and our SSL certificat, it will make us have a mountpoint in case the pod is crashing or get destroyed, he will pop-up again and will refer to the NFS to load his data

#### Setup (On the master Node)

```sudo apt-get install nfs-kernel-server``` Install the nfs server

```sudo mkdir /opt/certs``` Create a directory for storing the SSL certificat

```sudo mkdir /opt/registry``` Create a directory to store the images from the registry

`` sudo cat > /etc/exports<<EOF
/opt/certs	192.168.50.0/24(rw,sync,no_subtree_check,no_root_squash)
/opt/registry	192.168.50.0/24(rw,sync,no_subtree_check,no_root_squash)
EOF``
The/etc/exports file controls which file systems are exported to remote hosts and specifies the options.


```exportfs -a``` 
The exportfs command is used to manage the current table of file systems shared by NFS, the flag -a will share all the folders to the ip that are in /etc/exports


#### Setup (On the workers Nodes)

```sudo apt-get install nfs-common``` Install the nfs utilities to connect to the NFS server


```sudo mkdir /opt/certs``` Create a directory for storing the SSL certificat

```sudo mkdir /opt/registry``` Create a directory to store the images from the registry

``sudo nano cat >/etc/fstab << EOF
192.168.50.10:/opt/certs /opt/certs nfs defaults,user,auto,_netdev,bg 0 0
192.168.50.10:/opt/registry /opt/registry nfs defaults,user,auto,_netdev,bg 0 0
EOF
``

```sudo mount -a``` To mount the NFS partition

## Testing the NFS

In the master you can do ```touch /opt/registry/toto.txt``` and if your NFS is well configured you should see this file from the workers in the ```/opt/registry``` folder.

## Troubleshooting

## SSL Certificate


#### Setup (On the master Node)

`sudo openssl req -newkey rsa:4096 -nodes -sha256 -keyout /opt/certs/registry.key -x509 -days 365 -out /opt/certs/registry.crt` Generate the key and pem for the certificate


## Copy SSL certificate to all the nodes (Masters + Workers)

```sudo cp /opt/certs/registry.crt /usr/local/share/ca-certificates/```

### Add Master IP into /etc/hosts for the registry and update the SSL certificates (Masters + Workers)

sudo nano /etc/hosts

````MASTER_NODE_IP localmastername````


```sudo update-ca-certificates``` reload SSL certificates

```sudo systemctl restart docker``` for the changes to take effect


## Create the registry deployment

Create the monitoring namespace with ```kubectl create namespace registry```

In the project root you can find the deployment in /kubernates/registry/pods/private-registry.yaml

Copy it into the master and execute it like this : ```kubectl create -f private-registry.yaml -n registry```
Check your deployment status with this command : ```kubectl get deployments private-repository-k8s -n registry```

## Create the registry service

In the project root you can find the deployment in /kubernates/registry/pods/private-registry-svc.yaml

Copy it into the master and execute it like this : ```kubectl create -f private-registry-svc.yaml -n registry```
Check your pod status with this command : ```kubectl get svc private-repository-k8s -n registry```

## Test the Registry


```sudo docker pull nginx``` Pull a simple image

```sudo docker tag nginx:latest [localmastername in /etc/hosts]:registry_port/nginx:1.17``` 
Tag it with you localmastername:registry_port/image:version

```sudo docker push [localmastername in /etc/hosts]:registry_port/nginx:1.17```
Push it into your private registry

If you have an error, it may be because of your DNS/MASTER_NODE_IP/Bad_port/typo_error

## Build docker files

In the project root you can find the deployment in /kubernates/docker/dockerfiles/

In this directory you have 3 folders : database,backend and frontend. You need to build all of them

How to do it ?

```docker build -t [image:version] ./database/``` 

```docker build -t [image:version] ./backend/``` 

```docker build -t [image:version] ./frontend/``` 

## Build pods from these dockerfiles

Create the monitoring namespace with ```kubectl create namespace web```

In the project root you can find the deployment in /kubernates/docker/pods

In this directory you have 3 folders : db,backend and frontend wich contains a ```[folder]-deployment.yaml``` and a ```[folder]-svc.yaml```

In each deployment file you will have a ```image: [MASTER_NODE_IP:registry_port/image:version
]``` Replace it with your own ```[MASTER_NODE_IP:registry_port/image:version
]```

Then after this you can build with these commands :
 ```kubectl apply -f [folder]-deployment.yaml -n web```
  ```kubectl apply -f [folder]-svc.yaml -n web```

## Prometheus monitoring

Create the monitoring namespace with ```kubectl create namespace monitoring```

In the project root you can find the deployment in /kubernates/monitoring/prometheus/

Where you will have all the Configuration for prometheus

Apply them like that ```kubectl apply -f [file].yaml -n monitoring```

Orther of build :
- cluster-role.yaml
- service-account.yaml
- cluster-role-binding.yaml
- prometheus-config.yaml
- replicaset.yaml
- prometheus-service.yaml

## Acess to pods from outside
![alt text](https://cdn.discordapp.com/attachments/773166824774828032/827333088526204978/unknown.png)

If you want to see your monitoring or web pods you can access them like this :

```kubectl get svc -n [NAMESPACE]``` 
and take you MASTER_NODE_IP and  the 2nd port, for example 3000:[2ND_PORT].

So I Browse : http://MASTER_NODE_IP:31615

## To go Further :

Traefik : https://doc.traefik.io/traefik/
Helm : https://helm.sh/



