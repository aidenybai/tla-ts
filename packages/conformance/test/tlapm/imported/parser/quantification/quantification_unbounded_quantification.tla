(*---
description: The syntax corpus case "Unbounded Quantification" in quantification.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/quantification.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE quantification_unbounded_quantification ----
op1 == \A x : TRUE
op2 == \E x, y : FALSE
op3 == \AA x, y, z : TRUE
op4 == \EE x, y, z, w : FALSE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
