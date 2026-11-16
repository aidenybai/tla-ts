(*---
description: The syntax corpus case "Disjlist with CASE" in case.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/case.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE case_disjlist_with_case ----
op ==
  \/  CASE 1 -> 2
      [] 3 -> 2
      [] OTHER -> 5
  \/ 6
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
