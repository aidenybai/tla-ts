(*---
description: The syntax corpus case "VARIABLE Declaration" in unit.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/unit.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE unit_variable_declaration ----
VARIABLE a, b, c
VARIABLES x, y, z
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
