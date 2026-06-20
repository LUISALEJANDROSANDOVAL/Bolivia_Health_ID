import os
import glob

screens_dir = r'd:\Bolivia_Health_ID\mobile\src\screens'
for filepath in glob.glob(os.path.join(screens_dir, '*.tsx')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "from 'react-native'" not in content:
        import_stmt = "import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Animated, ActivityIndicator, Modal, Linking, Platform, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Switch } from 'react-native';"
        
        lines = content.split('\n')
        lines.insert(2, import_stmt)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        print(f'Fixed {filepath}')
