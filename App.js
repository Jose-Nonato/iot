import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './src/config/index';
import { useEffect, useState } from 'react';

import { addDoc, collection, getFirestore, getDocs, updateDoc, doc } from "firebase/firestore";

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const handleCreateAccount = () => {
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Continha criada ...");
      const user = userCredential.user;
      console.log(user);
      // navigation.navigate('Home');
    })
    .catch((error) => {
      console.log(error);
      Alert.alert(error.message);
    })
  }

  const handleSignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Conta logada ...");
      const user = userCredential.user;
      console.log(user);
      navigation.navigate('Home');
    })
    .catch((error) => {
      console.log(error);
    })
  }

  return(
      <View style={styles.container}>
          <Text>Email</Text>
          <TextInput placeholder='Informe seu email ...' onChangeText={(text) => setEmail(text)} style={styles.input}/>
          <Text>Senha</Text>
          <TextInput placeholder='Informe sua senha ...' onChangeText={(text) => setPassword(text)} style={styles.input}/>
          <TouchableOpacity onPress={handleSignIn}>
              <Text>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreateAccount}>
              <Text>Cadastro</Text>
          </TouchableOpacity>
      </View>
  );
}

function HomeScreen() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [nome, setNome] = useState('');
  const [status, setStatus] = useState('');
  const [consumo, setConsumo] = useState('');

  const navigation = useNavigation();

  const handleNavigateToDeviceList = () => {
    navigation.navigate('DevicesList');
  }

  const handleNovoServico = async() => {
    const newServico = {
      nome: nome,
      status: status,
      consumo: consumo
    }

    try {
      await addDoc(collection(db, 'servico'), newServico);
      console.log("Serviço adicionado!");
    } catch(error) {
      console.log(error);
    }

    setNome('');
    setStatus('');
    setConsumo('');
  }

  return(
    <View>
      <TextInput placeholder='Insira o nome do dispositivo ...' onChangeText={(text) => setNome(text)} style={styles.input}/>
      <TextInput placeholder='Insira o status do dispositivo (ligado ou desligado) ...' onChangeText={(text) => setStatus(text)} style={styles.input}/>
      <TextInput placeholder='Insira o consumo do dispositivo  ...' onChangeText={(text) => setConsumo(text)} style={styles.input}/>
      <TouchableOpacity onPress={handleNovoServico}>
        <Text>Adicionar Serviço</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNavigateToDeviceList}>
        <Text>Ir para a lista de dispositivos</Text>
      </TouchableOpacity>
    </View>
  );
}

function DevicesListScreen() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [devices, setDevices] = useState([]);
  const [reloadData, setReloadData] = useState(false);

  useEffect(() => {

    const fetchDevices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'servico'));
        const devicesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setDevices(devicesData);
      } catch (error) {
        console.error("Erro ao buscar serviços: ", error);
      }
    };

    fetchDevices();
  }, [reloadData]);

  const handleServicoOff = async (item) => {
    try {
      const docRef = doc(db, 'servico', item.id);
      await updateDoc(docRef, { status: 'Desligado' });
      console.log('Status atualizado com sucesso!');
      setReloadData(!reloadData);
      Alert.alert(`O dispositivo chamado ${item.nome} teve o status alterado para desligado!`)
    } catch (error) {
      console.error('Erro ao atualizar o status:', error);
    }
  };

  const handleServicoOn = async (item) => {
    try {
      const docRef = doc(db, 'servico', item.id);
      await updateDoc(docRef, { status: 'Ligado' });
      console.log('Status atualizado com sucesso!');
      setReloadData(!reloadData);
      Alert.alert(`O dispositivo chamado ${item.nome} teve o status alterado ligado!`)
    } catch (error) {
      console.error('Erro ao atualizar o status:', error);
    }
  };

  return (
    <View>
      <View style={styles.containerTitulo}>
        <Text style={styles.titulo}>Dispositivos</Text>
      </View>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => item.status === 'Ligado' ? handleServicoOff(item) : handleServicoOn(item)}>
            <Text style={styles.cardText}>Dispositivo: {item.nome}</Text>
            <Text style={styles.cardText}>Consumo do Dispositivo: {item.consumo}</Text>
            <Text style={styles.cardText}>Status: <Text style={[styles.cardText, item.status === 'Ligado' ? styles.greenText : styles.redText]}>{item.status}</Text></Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouterName="Login">
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Home" component={HomeScreen}/>
        <Stack.Screen name="DevicesList" component={DevicesListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  cardText: {
    fontSize: 16,
    marginBottom: 8,
  },
  containerTitulo: {
    backgroundColor: '#73909C',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  greenText: {
    color: 'green',
  },
  redText: {
    color: 'red',
  },
});