(*---
description: The syntax corpus case "Conjlist Followed by Disjunct" in jlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/jlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE jlist_conjlist_followed_by_disjunct ----
op ==
    /\ 1
    /\ 2
    \/ 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
