(*---
description: The syntax corpus case "CASE in jlist with weird indentation" in case.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/case.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE case_case_in_jlist_with_weird_indentation ----
op ==
  /\ CASE 1 ->
      /\ 2
      /\ 3
        [] 4 -> 5
  /\ 6
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
