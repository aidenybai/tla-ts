(*---
description: The syntax corpus case "Record Literal" in records.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/records.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE records_record_literal ----
op == [
  foo |-> 1,
  bar |-> 2,
  baz |-> 3
]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
