(*---
description: The syntax corpus case "Nonempty Tuple" in tuples.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/tuples.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE tuples_nonempty_tuple ----
op == <<1, 2, 3, 4, 5>> 
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
