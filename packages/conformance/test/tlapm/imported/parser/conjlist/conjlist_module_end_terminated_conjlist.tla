(*---
description: The syntax corpus case "Module-End-Terminated Conjlist" in conjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/conjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE conjlist_module_end_terminated_conjlist ----
op ==
  /\ 1
  /\ 2  ====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
