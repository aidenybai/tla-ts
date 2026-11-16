(*---
description: The syntax corpus case "Start-of-Line Disjlist" in disjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/disjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE disjlist_start_of_line_disjlist ----
op ==
\/ 1
\/ 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
