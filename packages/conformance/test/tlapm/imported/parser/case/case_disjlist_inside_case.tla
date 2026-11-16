(*---
description: The syntax corpus case "Disjlist inside CASE" in case.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/case.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE case_disjlist_inside_case ----
op ==
  CASE
    \/ 1
    \/ 2
      ->
        \/ 3
        \/ 4
  []
    \/ 5
    \/ 6
      ->
        \/ 7
        \/ 8
  [] OTHER ->
    \/ 7
    \/ 8
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
