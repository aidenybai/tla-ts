(*---
description: The syntax corpus case "Basic Label" in labels.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/labels.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE labels_basic_label ----
op(x) == lbl :: x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
