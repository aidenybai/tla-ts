(*---
description: The syntax corpus case "Record Literal with JList" in records.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/records.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE records_record_literal_with_jlist ----
op == [
  foo |->
    /\ 1
    /\ 2,
      bar |->
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
