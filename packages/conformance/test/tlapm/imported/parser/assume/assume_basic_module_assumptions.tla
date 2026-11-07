(*---
description: The syntax corpus case "Basic Module Assumptions" in assume.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/assume.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE assume_basic_module_assumptions ----
ASSUME TRUE
ASSUMPTION TRUE
AXIOM TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
