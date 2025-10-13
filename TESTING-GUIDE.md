# 🧪 Guia de Testes - Física Cannon.js

## 🚀 Como Testar a Implementação

### 1️⃣ **Iniciar o Servidor**

```bash
npm run dev
```

Servidor estará disponível em: `https://localhost:3000/`

---

## 🎮 Páginas de Teste

### 📍 **Demo Interativa (RECOMENDADO para começar)**

**URL:** `https://localhost:3000/scenes/physics-demo.html`

**O que testar:**

- ✅ Pressione **ESPAÇO** várias vezes para soltar bolas
- ✅ Observe as bolas caindo e colidindo
- ✅ Pressione **D** para ativar debug visual (wireframes verde)
- ✅ Pressione **R** para resetar a cena
- ✅ Use **WASD** para se mover pela cena

**Demos incluídas:**

1. **Rampa** - Esfera deslizando (física de fricção)
2. **Dominós** - Cascata em cadeia
3. **Colisões** - Cubo pesado vs esfera leve
4. **Alavanca** - Braço móvel simplificado

---

### 📍 **Jogo Principal**

**URL:** `https://localhost:3000/scenes/game.html`

**O que testar:**

- ✅ Verifique se os objetos caem com gravidade
- ✅ Teste colisão com o chão
- ✅ Verifique se o componente lever carrega
- ✅ Interaja com a alavanca (se houver no nível)

---

### 📍 **Menu Principal**

**URL:** `https://localhost:3000/`

**O que testar:**

- ✅ Physics system carregado no console
- ✅ Navegação entre cenas funcional

---

## 🔍 Checklist de Validação

### ✅ **Física Básica**

- [ ] Objetos caem com gravidade (-9.8 m/s²)
- [ ] Objetos colidem com o chão
- [ ] Objetos colidem entre si
- [ ] Objetos não atravessam paredes/chão

### ✅ **Componente Lever**

- [ ] Alavanca carrega sem erros
- [ ] Base fica estática (não cai)
- [ ] Braço pode rotacionar
- [ ] Indicadores verde/vermelho funcionam
- [ ] Clique na alavanca alterna estado
- [ ] Rotação suave entre estados

### ✅ **Componente Sphere**

- [ ] Esfera rola realisticamente
- [ ] Quica ao cair (restitution)
- [ ] Para gradualmente (damping)
- [ ] Emite eventos de colisão

### ✅ **Componente Cube**

- [ ] Cubo cai e colide
- [ ] Mais estável que esfera (fricção)
- [ ] Efeito de shake em colisão forte
- [ ] Para gradualmente

### ✅ **Physics Connector**

- [ ] Detecta colisões
- [ ] Mostra efeito visual de conexão
- [ ] Ativa próximo objeto
- [ ] Partículas aparecem

### ✅ **Performance**

- [ ] FPS acima de 60 (desktop)
- [ ] Sem lag com 10-20 objetos
- [ ] Smooth em VR (se testando em headset)

---

## 🐛 Debug e Troubleshooting

### **Debug Visual**

Na demo, pressione **D** para ativar wireframes físicos.

Ou adicione no código:

```html
<a-scene physics="debug: true"></a-scene>
```

### **Console Logs**

Abra o DevTools (F12) e veja:

- ✅ "Physics system loaded"
- ✅ "Lever initialized"
- ✅ "Sphere physics configured"
- ✅ "Collision detected"

### **Problemas Comuns**

#### ❌ **Objetos atravessam o chão**

**Solução:** Verifique se o chão tem `static-body`

```html
<a-plane static-body></a-plane>
```

#### ❌ **Alavanca não rotaciona**

**Solução:** Verifique se o modelo GLB carregou

```javascript
// No console
const lever = document.querySelector('[lever]');
console.log(lever.components.lever.leverObject); // Deve retornar objeto
```

#### ❌ **Colisões não detectadas**

**Solução:** Verifique se ambos têm body físico

```javascript
const obj = document.querySelector('#myObject');
console.log(obj.body); // Deve retornar CANNON.Body
```

#### ❌ **FPS baixo**

**Soluções:**

- Reduza número de objetos dinâmicos
- Aumente damping (objetos param mais rápido)
- Desative debug visual
- Reduza iterations do solver

---

## 📊 Testes de Performance

### **Teste 1: Stress Test**

Na demo, pressione **ESPAÇO** 50 vezes rapidamente.

- ✅ **Esperado:** FPS > 30, sem crashes
- ❌ **Falha:** FPS < 20 ou travamento

### **Teste 2: Dominó Chain**

Solte uma bola nos dominós.

- ✅ **Esperado:** Todos caem em sequência
- ❌ **Falha:** Alguns não caem ou flutuam

### **Teste 3: Lever Interaction**

Clique na alavanca 10 vezes seguidas.

- ✅ **Esperado:** Responde sempre, rotação suave
- ❌ **Falha:** Não responde ou trava

---

## 🎯 Cenários de Teste Específicos

### **Cenário 1: Máquina Simples**

1. Crie uma esfera no alto
2. Crie uma rampa
3. Coloque um cubo na base
4. Solte a esfera
5. **Esperado:** Esfera desce, atinge cubo, cubo se move

### **Cenário 2: Cadeia de Dominós**

1. Use `createDominoChain()` para criar 10 dominós
2. Solte uma esfera pesada no primeiro
3. **Esperado:** Todos caem em sequência

### **Cenário 3: Alavanca Ativada por Colisão**

1. Crie uma alavanca
2. Solte uma esfera pesada sobre ela
3. **Esperado:** Alavanca muda de estado com impacto forte

---

## 🎮 Teste em VR (Opcional)

Se tiver um headset VR (Quest, Vive, etc.):

1. Acesse `https://<seu-ip>:3000/scenes/physics-demo.html`
2. Clique no botão VR
3. Use os controles para:
   - Apontar e teleportar
   - Agarrar objetos (gatilho)
   - Soltar objetos

**Validação VR:**

- [ ] Objetos podem ser agarrados
- [ ] Física funciona ao soltar
- [ ] FPS estável (72+ no Quest 2)
- [ ] Sem motion sickness

---

## ✅ Checklist Final

Antes de considerar completo, verifique:

### Código

- [ ] Nenhum erro no console
- [ ] Todos os componentes carregam
- [ ] Physics system inicializa

### Visual

- [ ] Objetos renderizam corretamente
- [ ] Sombras funcionam
- [ ] Efeitos visuais (partículas, linhas) aparecem

### Interação

- [ ] Clique funciona
- [ ] Hover funciona (desktop)
- [ ] VR controllers funcionam (se aplicável)

### Performance

- [ ] FPS acima de 60 (desktop)
- [ ] FPS acima de 72 (VR)
- [ ] Sem memory leaks (teste por 5+ minutos)

---

## 📸 Screenshots Recomendados

Tire screenshots de:

1. Demo com debug ativado (wireframes verdes)
2. Dominós caindo em cadeia
3. Múltiplas bolas colidindo
4. Alavanca em diferentes estados
5. Console com logs de colisão

---

## 🚦 Status de Aprovação

| Teste                 | Status      | Notas                   |
| --------------------- | ----------- | ----------------------- |
| Physics System Load   | ⏳ Pendente | Verificar console       |
| Gravity & Collision   | ⏳ Pendente | Testar na demo          |
| Lever Component       | ⏳ Pendente | Verificar rotação       |
| Sphere/Cube Physics   | ⏳ Pendente | Testar quique e fricção |
| Physics Connector     | ⏳ Pendente | Testar conexões         |
| Performance (Desktop) | ⏳ Pendente | FPS > 60?               |
| Performance (VR)      | ⏳ Pendente | FPS > 72?               |

---

## 🎉 Após Aprovação

Quando todos os testes passarem:

1. ✅ Marque todos como aprovados
2. 📝 Documente issues encontradas
3. 🚀 Comece a criar níveis com física!

---

## 💡 Dicas

- Sempre teste com debug ativado primeiro
- Comece simples (1-2 objetos) e aumente complexidade
- Use console.log abundantemente durante desenvolvimento
- Salve configurações que funcionam bem
- Grave vídeos de bugs para análise

---

**Boa sorte nos testes!** 🎮✨
