import React, {useEffect, useRef} from "react";
import {Modal, View, Text, Pressable,StyleSheet, Animated, Easing } from "react-native";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/auth/AuthContext";

export interface MatchInfo {
    otherUserId: string;
    otherName: string;
    otherPhotoUrl?: string | null;
    conversationId: string;
}

interface Props{
    match: MatchInfo | null;
    onDismiss: () => void;
    onSendMessage: (m:MatchInfo) => void;
}

export function MatchModal({match, onDismiss, onSendMessage}: Props){
    const {colors, spacing, radius} = useTheme();
    const {user} = useAuth();
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if( match){
            animation.setValue(0);
            Animated.timing(animation, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }).start();
        }
    },[match, animation]);

    if(!match) return null;

    const avatarScale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    const titleTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
        <View style={[styles.backdrop, { backgroundColor: colors.primaryDeep + 'F2' }]}>
            <Animated.View style={[styles.title, { opacity: animation, transform: [{ translateY: titleTranslate }] }]}>
            <Text style={[styles.titleText, { color: '#FFFFFF' }]}>It's a Match!</Text>
            <Text style={[styles.subtitleText, { color: '#FFFFFFCC' }]}>
                You and {match.otherName} both want to train together.
            </Text>
            </Animated.View>
    
            <View style={styles.avatars}>
            <Animated.View style={{ transform: [{ scale: avatarScale }, { rotate: '-8deg' }] }}>
                <View style={[styles.avatarRing, { borderColor: '#FFFFFF' }]}>
                <Avatar uri={null} name={user?.email ?? '?'} size={120} />
                </View>
            </Animated.View>
            <View style={[styles.heart, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.heartGlyph, { color: colors.primaryDeep }]}>♥</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: avatarScale }, { rotate: '8deg' }] }}>
                <View style={[styles.avatarRing, { borderColor: '#FFFFFF' }]}>
                <Avatar uri={match.otherPhotoUrl} name={match.otherName} size={120} />
                </View>
            </Animated.View>
            </View>
    
            <Animated.View style={[styles.actions, { opacity: animation, marginTop: spacing.xxl }]}>
            <Button
                title="Send a message"
                onPress={() => onSendMessage(match)}
                style={{ backgroundColor: '#FFFFFF' }}
            />
            <View style={{ height: spacing.md }} />
            <Pressable onPress={onDismiss} style={{ alignItems: 'center', padding: spacing.md }}>
                <Text style={{ color: '#FFFFFFCC', fontWeight: '600', fontSize: 15 }}>
                Keep swiping
                </Text>
            </Pressable>
            </Animated.View>
        </View>
        </Modal>
    );
    }
    
    const styles = StyleSheet.create({
        backdrop: { 
            flex: 1, 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 24 
        },
        title: { 
            alignItems: 'center', 
            marginBottom: 32 
        },
        titleText: { 
            fontSize: 36, 
            fontWeight: '800', 
            letterSpacing: 0.5 
        
        },
        subtitleText: { 
            fontSize: 15, 
            textAlign: 'center', 
            marginTop: 8, 
            paddingHorizontal: 24 
        
        },
        avatars: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 12 
        
        },
        avatarRing: { 
            borderWidth: 3, 
            borderRadius: 999, 
            padding: 3 
        
        },
        heart: {
            width: 48, height: 48, borderRadius: 24,
            alignItems: 'center', justifyContent: 'center',
            marginHorizontal: -16, zIndex: 1,
            elevation: 4,
            shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
        },
        heartGlyph: { 
            fontSize: 24, 
            fontWeight: '900' 
        },
        actions: { 
            alignSelf: 'stretch', 
            paddingHorizontal: 24 
        },
        });

