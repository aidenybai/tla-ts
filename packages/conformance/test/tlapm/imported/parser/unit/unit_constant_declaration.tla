(*---
description: The syntax corpus case "CONSTANT Declaration" in unit.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/unit.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE unit_constant_declaration ----
CONSTANT x, y, z
CONSTANTS f(_, _), _+_, -._, _^+
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
