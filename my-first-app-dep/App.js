import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, Alert } from "react-native";
import socket from "./socket";

const emojis = ['😊', '😎', '😢', '🔥', '💬', '✨']; // Lista de emojis

const ChatForm = ({ color, messages, onSend, username, oldUsername, onUsernameChange, statusEmoji, onStatusChange }) => {
  const [message, setMessage] = useState('');
  const [currentUsername, setCurrentUsername] = useState(username);

  const sendMessage = () => {
    if (currentUsername.trim() === '') {
      Alert.alert('Erro', 'Por favor, insira um nome de usuário antes de enviar a mensagem.'); // Alerta se o nome de usuário estiver vazio
      return;
    }

    if (message.trim()) {
      onSend(`${statusEmoji} ${message}`, currentUsername); // Envia o emoji antes da mensagem
      setMessage('');
    }
  };

  return (
    <View style={[styles.formContainer, { backgroundColor: color }]}>
      <View style={styles.usernameContainer}>
        <TextInput
          value={currentUsername}
          onChangeText={(text) => {
            setCurrentUsername(text);
            onUsernameChange(text);
          }}
          style={styles.usernameInput}
        />
        <Text style={styles.oldUsername}>({oldUsername})</Text>
      </View>
      
      <View style={styles.statusContainer}>
        {emojis.map((emoji) => (
          <TouchableOpacity key={emoji} onPress={() => onStatusChange(emoji)}>
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.selectedEmoji}>{statusEmoji}</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={({ item }) => <Text style={styles.message}>{item.username}: {item.message}</Text>}
        keyExtractor={(item, index) => index.toString()}
      />
      
      <TextInput
        placeholder='Digite sua mensagem'
        value={message}
        onChangeText={setMessage}
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={sendMessage}>
        <Text style={styles.buttonText}>Enviar mensagem</Text>
      </Pressable>
    </View>
  );
};

const ColorPicker = ({ selectedColor, onSelectColor }) => {
  const colors = ['#FF6347', '#00BFFF', '#32CD32']; // Adicione suas cores aqui

  return (
    <View style={styles.colorPickerContainer}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          style={[styles.colorOption, { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0 }]}
          onPress={() => onSelectColor(color)}
        />
      ))}
    </View>
  );
};

export default function App() {
  const [messages, setMessages] = useState([]); // Mensagens comuns para ambas as salas
  const [usernameBlue, setUsernameBlue] = useState(''); // Nome do usuário azul
  const [usernameRed, setUsernameRed] = useState(''); // Nome do usuário vermelho
  const [statusBlue, setStatusBlue] = useState(''); // Status do usuário azul
  const [statusRed, setStatusRed] = useState(''); // Status do usuário vermelho
  const [colorBlue, setColorBlue] = useState('#00BFFF'); // Cor inicial do formulário azul
  const [colorRed, setColorRed] = useState('#FF6347'); // Cor inicial do formulário vermelho

  useEffect(() => {
    // Recupera mensagens do localStorage
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    setMessages(storedMessages);

    // Entrando nas salas correspondentes
    socket.emit('join_room', 'blue');
    socket.emit('join_room', 'red');

    // Escutando as mensagens recebidas
    socket.on('receive_message', ({ message, username }) => {
      const newMessages = [...messages, { message, username }];
      setMessages(newMessages); // Adiciona à lista comum
      localStorage.setItem('messages', JSON.stringify(newMessages)); // Armazena no localStorage
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const handleSend = (message, username) => {
    // Envia a mensagem para ambas as salas
    socket.emit('send_message', { message, username });
    const newMessages = [...messages, { message, username }];
    setMessages(newMessages); // Adiciona à lista comum
    localStorage.setItem('messages', JSON.stringify(newMessages)); // Armazena no localStorage
  };

  return (
    <View style={styles.container}>
      <ColorPicker selectedColor={colorBlue} onSelectColor={setColorBlue} />
      <ChatForm
        color={colorBlue} // Cor da caixa azul
        messages={messages}
        onSend={handleSend}
        username={usernameBlue}
        oldUsername={usernameBlue}
        onUsernameChange={setUsernameBlue}
        statusEmoji={statusBlue}
        onStatusChange={setStatusBlue}
      />
      <ColorPicker selectedColor={colorRed} onSelectColor={setColorRed} />
      <ChatForm
        color={colorRed} // Cor da caixa vermelha
        messages={messages}
        onSend={handleSend}
        username={usernameRed}
        oldUsername={usernameRed}
        onUsernameChange={setUsernameRed}
        statusEmoji={statusRed}
        onStatusChange={setStatusRed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formContainer: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  usernameInput: {
    backgroundColor: 'white',
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  oldUsername: {
    color: 'gray',
    alignSelf: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap', // Permite que os emojis se ajustem em várias linhas
  },
  emoji: {
    fontSize: 24,
    marginRight: 5,
  },
  selectedEmoji: {
    fontSize: 24,
    marginLeft: 10,
  },
  input: {
    backgroundColor: 'white' ,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 5,
    borderRadius: 5,
  },
  button: {
    backgroundColor: 'white',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  message: {
    padding: 5,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderColor: 'black',
  },
});
