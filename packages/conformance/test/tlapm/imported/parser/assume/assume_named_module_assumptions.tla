(*---
description: The syntax corpus case "Named Module Assumptions" in assume.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/assume.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE assume_named_module_assumptions ----
ASSUME a1 == TRUE
ASSUMPTION a2 == TRUE
AXIOM a3 == TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
