(*---
description: The syntax corpus case "Basic CASE" in case.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/case.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE case_basic_case ----
op ==
    CASE 1 -> 2
    [] 3 -> 4
    [] OTHER -> 5
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
