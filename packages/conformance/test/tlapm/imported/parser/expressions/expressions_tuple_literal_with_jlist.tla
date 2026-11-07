(*---
description: The syntax corpus case "Tuple Literal with Jlist" in expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE expressions_tuple_literal_with_jlist ----
op == <<
  /\ 1
  /\ 2
    >>
  /\ 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
