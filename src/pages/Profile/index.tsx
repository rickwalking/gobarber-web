import React, { ChangeEvent, useCallback, useRef } from 'react';

import { Link, useHistory } from 'react-router-dom';

import {
    FiMail,
    FiUser,
    FiLock,
    FiCamera,
    FiArrowLeft,
} from 'react-icons/fi';

import * as Yup from 'yup';

import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';

import api from '../../services/api';

import { useToast } from '../../hooks/toast';

import Input from '../../components/Input';
import Button from '../../components/Button';

import getValidationErrors from '../../utils/getValidationErrors';

import {
    Container,
    Content,
    AvatarInput,
} from './styles';
import { useAuth } from '../../hooks/auth';

interface ProfileFormData {
    name: string;
    email: string;
    old_password: string;
    password: string;
    password_confirmation: string;
}

const Profile: React.FC = () => {
    const formRef = useRef<FormHandles>(null);
    const { addToast } = useToast();
    const history = useHistory();

    const { user, updateUser } = useAuth();

    const handleSubmit = useCallback(async (data: ProfileFormData) => {
        try {
            formRef.current?.setErrors({ });
            const schema = Yup.object().shape({
                name: Yup.string().required('name obrigatório'),
                email: Yup.string().required('E-mail obrigatório').email('Digite um e-mail válido'),
                old_password: Yup.string(),
                password: Yup.string().when('old_password', {
                    is: val => !!val.length,
                    then: Yup.string().required(),
                    otherwise: Yup.string(),
                }),
                password_confirmation: Yup.string().oneOf(
                    [Yup.ref('password'), ''],
                    'Confirmação incorreta',
                ),
            });

            await schema.validate(data, {
                abortEarly: false,
            });

            const {
                name,
                email,
                old_password,
                password,
                password_confirmation,
            } = data;

            const formData = Object.assign({
                name,
                email,
            }, old_password ? {
                old_password,
                password,
                password_confirmation,
            }: { });

            const response = await api.put('/profile', formData);
            updateUser(response.data.user);

            history.push('/dashboard');

            addToast({
                type: 'success',
                title: 'Perfil Atualizado!',
                description: 'Suas informações do perfil foram atualizadas com sucesso!'
            });
        } catch(error) {
            if (error instanceof Yup.ValidationError) {
                const errors = getValidationErrors(error);
    
                formRef.current?.setErrors(errors);

                return;
            }

            addToast({
                type: 'error',
                title: 'Erro na atualização',
                description: 'Ocorreu um eror ao atualizar o perfil, tente novamente.'
            });
        }
    }, [addToast, history, updateUser]);

    const handleAvatarChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files === null) {
            return;
        }

        const formData = new FormData();
        formData.append('avatar', event.target.files[0]);

        api.patch('/users/avatar', formData).then((response) => {
            console.log(response);
            updateUser(response.data.user);
            addToast({
                type: 'success',
                title: 'Avatar atualizado',
                description: '',
            });
        });
    }, [addToast, updateUser]);

    return (
        <Container>
            <header>
                <div>
                    <Link to="/dashboard">
                        <FiArrowLeft />
                    </Link>
                </div>
            </header>
            <Content>
                <Form ref={formRef} initialData={{
                    name: user.name,
                    email: user.email,
                }} onSubmit={handleSubmit}>
                    <AvatarInput>
                        <img src={user.avatar_url} alt={user.name} />
                        <label htmlFor="avatar">
                            <FiCamera />
                            <input type="file" id="avatar" onChange={handleAvatarChange} />
                        </label>
                    </AvatarInput>
                    <h1>Meu perfil</h1>
                    <Input
                        name='name'
                        icon={FiUser}
                        type="text"
                        placeholder='Nome'
                    />
                    <Input
                        name='email'
                        icon={FiMail}
                        type="text"
                        placeholder='E-mail'
                    />
                    <Input
                        containerStyle={{ marginTop: 24 }}
                        name='old_password'
                        icon={FiLock}
                        type="password"
                        placeholder='Senha atual'
                    />
                    <Input
                        name='password'
                        icon={FiLock}
                        type="password"
                        placeholder='Nova senha'
                    />
                    <Input
                        name='password_confirmation'
                        icon={FiLock}
                        type="password"
                        placeholder='Confirmar senha'
                    />
                    <Button type='submit'>Confirmar mudanças</Button>
                </Form>
            </Content>
        </Container>
    );
}
export default Profile;
