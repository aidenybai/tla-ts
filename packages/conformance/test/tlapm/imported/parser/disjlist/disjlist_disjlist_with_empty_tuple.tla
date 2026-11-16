(*---
description: The syntax corpus case "Disjlist with Empty Tuple" in disjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/disjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE disjlist_disjlist_with_empty_tuple ----
op ==
  \/ 1
  \/ <<>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
