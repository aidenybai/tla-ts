(*---
description: The syntax corpus case "Set of Records with JList" in records.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/records.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE records_set_of_records_with_jlist ----
op == [
  foo :
    /\ 1
    /\ 2,
      bar :
        \/ 3
        \/ 4
]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
