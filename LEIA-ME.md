# DubWorks · 1 ano

## Abrir e publicar

O GitHub Pages publica os arquivos da raiz do repositório. A pasta `dist` guarda a cópia de distribuição. Ao atualizar o calendário, mantenha os arquivos correspondentes das duas pastas iguais. Abra a URL publicada e confira a imagem, um cartão bloqueado e o botão para adicionar o aniversário ao Google Agenda.

## Atualizar uma surpresa

As datas usam o horário de Brasília. O cartão de 07/11/2026 abre às 12h30. Os outros cartões da programação abrem à meia-noite da data indicada. A contagem do aniversário termina à meia-noite de 25/11/2026.

1. Edite `surpresas.js` na raiz e copie o arquivo atualizado para `dist` antes de publicar.
2. Acrescente uma entrada com o dia, título e texto. Preserve as entradas já divulgadas.
3. Republique os arquivos e confira o cartão na URL pública. Quem estiver com a página aberta deve recarregá-la.

Exemplo de formato:

```js
window.dubworksSurpresas = {
  "2026-11-07": {
    titulo: "Título aprovado",
    texto: "Texto aprovado para divulgação."
  }
};
```

O navegador pode ler todo o conteúdo já enviado ao site, mesmo que um cartão ainda esteja bloqueado pela data. Para voltar a bloquear um cartão, remova a entrada e republique. O conteúdo que já foi divulgado pode ter sido visto ou copiado.

## Adicionar o aniversário ao Google Agenda

O botão **Adicionar aniversário da DubWorks ao Google Agenda** abre diretamente a tela de criação de evento do Google Agenda, com **1 ano da DubWorks** preenchido como evento de dia inteiro em **25/11/2026**. O visitante confere os dados e clica em **Salvar** na própria Agenda. Não é necessário baixar `.ics` ou importar arquivos. As outras sete datas continuam no calendário interativo do site, mas não são incluídas na Agenda.

## Adicionar inscrições e links do evento

Em `dist/surpresas.js`, acrescente a lista opcional `links` à surpresa. Use o endereço HTTPS real de cada formulário ou página. Quando a data chegar e a surpresa estiver publicada, os botões aparecem ao abrir o cartão.

Exemplo ilustrativo para 07/11:

```js
window.dubworksSurpresas = {
  "2026-11-07": {
    titulo: "DubWorks Gaming",
    texto: "Confira os detalhes do encontro e faça sua inscrição.",
    links: [
      { rotulo: "Fazer inscrição", url: "https://exemplo.com/formulario" }
    ]
  }
};
```

## Passaporte e medalha

Os check-ins abrem no cartão de cada evento, nos dias 07, 10, 13, 16, 19, 22, 25 e 27/11, da meia-noite ao fim do dia no horário de Brasília. O código do dia é compartilhado por todos os participantes. Envie pelo [formulário de presença do aniversário](https://docs.google.com/forms/d/e/1FAIpQLSfippGknSlzCZu9kf9PTaiIxMmQyG1Qzw1EHGW7TdVOnid4tQ/viewform) com a mesma conta Google nas oito datas.

A planilha vinculada guarda o horário, o e-mail verificado e o código. A aba **Apuração** compara o dia do código ao dia em que a resposta chegou e conta uma presença por data e e-mail. Oito presenças dão elegibilidade para o emblema no encerramento de 27/11. A distribuição do emblema no Passaporte fica para uma etapa posterior.
