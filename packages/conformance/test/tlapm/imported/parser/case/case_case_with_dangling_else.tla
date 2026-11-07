(*---
description: The syntax corpus case "CASE with dangling else" in case.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/case.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE case_case_with_dangling_else ----
op ==
  CASE 1 ->
  CASE 2 -> 3
  [] OTHER -> 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
