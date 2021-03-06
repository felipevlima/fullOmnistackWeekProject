import React, { Component } from 'react';
import { Text, View, FlatList, TouchableOpacity, Button } from 'react-native';
import { distanceInWords } from "date-fns";
import ImagePicker from "react-native-image-picker";
import RNFS, { DocumentDirectoryPath } from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import socket from "socket.io-client";

import pt from "date-fns/locale/pt";
import styles from './styles';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import api from '../../services/api';
import { HeaderBackButton, Header, navigate } from 'react-navigation';

export default class Box extends Component {
  state = { box: {} }

  async componentDidMount() {
    const box = await AsyncStorage.getItem('@ProntecBox:box');

    this.subscribeToNewFiles(box);

    const response = await api.get(`boxes/${box}`);

    this.setState({ box: response.data })
  }

  subscribeToNewFiles = (box) => {
    const io = socket ('https://omnistackfelipe.herokuapp.com')

    io.emit('connectRoom', box);

    io.on('file', data => {
      this.setState({ box: { ...this.state.box, files: [data, ...this.state.box.files] } })
    })
  }

  openFile = async file => {
    const filePath = `${RNFS.DocumentDirectoryPath}/${file.title}`
    try {
      await RNFS.downloadFile({
        fromUrl: file.url,
        toFile: filePath
      })

      await FileViewer.open(filePath);

    } catch (err) {
      console.log('arquivo Não suportado')
    }
  }

  handleUpload = () => {
    ImagePicker.launchImageLibrary({}, async upload => {
      if (upload.error) {
        console.log('ImagePickerError')
      } else if (upload.didCancel) {
        console.log('Canceled by User')
      } else {
        const data = new FormData();

        const [prefix, suffix] = upload.fileName.split('.');
        const ext = suffix.toLowerCase() === 'heic' ? 'jpg' : suffix;

        data.append('file', {
          uri: upload.uri,
          type: upload.type,
          name: `${prefix}.${ext}`
        });

        api.post(`boxes/${this.state.box._id}/files`, data);
      }
    });
  }
  
  renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => this.openFile(item)} style={styles.file}>

    <View style={styles.fileInfo}>
      <Icon name="insert-drive-file" size={24} color="#A5CFFF" />
      <Text style={styles.fileTitle}>{item.title}</Text>
    </View>

    <Text style={styles.fileDate}>
      há{" "} 
      {distanceInWords(item.createdAt, new Date(), {
        locale: pt
      })}
    </Text>
    </TouchableOpacity>
  );
  
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.boxTitle}>{this.state.box.title}</Text> 
        <FlatList
          style={styles.list}
          data={this.state.box.files}
          keyExtractor={file => file._id}
          ItemSeparatorComponent={ () => <View style={styles.separator} />}
          renderItem={this.renderItem}
        />
        
        <Button style={styles.backbutton} title="Back" onPress={() => this.props.navigation.navigate('Main')}/>
        
        <TouchableOpacity style={styles.fab} onPress={this.handleUpload}>
          <Icon name="cloud-upload" size={24} color="#FFF" />
        </TouchableOpacity>

      </View>
    )}
}
