(*---
description: The syntax corpus case "Two Mismatched Jlists" in jlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/jlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE jlist_two_mismatched_jlists ----
opA ==
    /\ 1
    /\ 2
    \/ 3

opB ==
    \/ 1
    \/ 2
    /\ 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
