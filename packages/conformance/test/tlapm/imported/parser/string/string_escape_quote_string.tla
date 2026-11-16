(*---
description: The syntax corpus case "Escape Quote String" in string.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/string.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE string_escape_quote_string ----
op == "The cow goes \"moo\", the chicken goes \"cluck cluck\""
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
