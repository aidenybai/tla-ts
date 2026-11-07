(*---
description: The syntax corpus case "Unbounded CHOOSE With Tuple" in quantification.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/quantification.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE quantification_unbounded_choose_with_tuple ----
op == CHOOSE <<x, y, z>> : FALSE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
