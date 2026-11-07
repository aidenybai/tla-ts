(*---
description: The syntax corpus case "Disjlist Followed by Conjunct" in jlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/jlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE jlist_disjlist_followed_by_conjunct ----
op ==
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
