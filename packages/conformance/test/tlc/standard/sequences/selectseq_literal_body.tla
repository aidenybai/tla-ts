(*---
description: "A LAMBDA whose body is only a literal reaches SelectSeq as that value, because Spec.lookup returns the tool object of the body. Real TLC bug: the LAMBDA is rejected as not an operator, naming 1."
ref: tlc2/tool/impl/Spec.java#lookup
features:
  - Sequences
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module selectseq_literal_body failed.
      2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
      <Operator LAMBDA>
  init:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
      <Operator LAMBDA>
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in selectseq_literal_body
      1. Line 74, column 29 to line 74, column 32 in selectseq_literal_body
      2. Line 72, column 9 to line 72, column 45 in selectseq_literal_body
      3. Line 72, column 9 to line 72, column 38 in selectseq_literal_body
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
      <Operator LAMBDA>
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in selectseq_literal_body
      1. Line 76, column 8 to line 76, column 32 in selectseq_literal_body
      2. Line 76, column 29 to line 76, column 32 in selectseq_literal_body
      3. Line 72, column 9 to line 72, column 45 in selectseq_literal_body
      4. Line 72, column 9 to line 72, column 38 in selectseq_literal_body
  next:
    exit: 255
    transcript: |-
      2169:1 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
      <Operator LAMBDA>
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 33 in selectseq_literal_body
      1. Line 75, column 30 to line 75, column 33 in selectseq_literal_body
      2. Line 72, column 9 to line 72, column 45 in selectseq_literal_body
      3. Line 72, column 9 to line 72, column 38 in selectseq_literal_body
  property:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
      <Operator LAMBDA>
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in selectseq_literal_body
      1. Line 75, column 12 to line 75, column 36 in selectseq_literal_body
      2. Line 75, column 33 to line 75, column 36 in selectseq_literal_body
      3. Line 72, column 9 to line 72, column 45 in selectseq_literal_body
      4. Line 72, column 9 to line 72, column 38 in selectseq_literal_body
---*)
---- MODULE selectseq_literal_body ----
EXTENDS Sequences, Naturals
Test == SelectSeq(<<1>>, LAMBDA e : 1) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module selectseq_literal_body failed.
    2169:0 The second argument of SelectSeq should be a operator, but instead it is:
    1
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a operator, but instead it is:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in selectseq_literal_body
    1. Line 15, column 29 to line 15, column 32 in selectseq_literal_body
    2. Line 13, column 9 to line 13, column 45 in selectseq_literal_body
    3. Line 13, column 9 to line 13, column 38 in selectseq_literal_body
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of SelectSeq should be a operator, but instead it is:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in selectseq_literal_body
    1. Line 16, column 30 to line 16, column 33 in selectseq_literal_body
    2. Line 13, column 9 to line 13, column 45 in selectseq_literal_body
    3. Line 13, column 9 to line 13, column 38 in selectseq_literal_body
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a operator, but instead it is:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in selectseq_literal_body
    1. Line 17, column 8 to line 17, column 32 in selectseq_literal_body
    2. Line 17, column 29 to line 17, column 32 in selectseq_literal_body
    3. Line 13, column 9 to line 13, column 45 in selectseq_literal_body
    4. Line 13, column 9 to line 13, column 38 in selectseq_literal_body
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a operator, but instead it is:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in selectseq_literal_body
    1. Line 16, column 12 to line 16, column 36 in selectseq_literal_body
    2. Line 16, column 33 to line 16, column 36 in selectseq_literal_body
    3. Line 13, column 9 to line 13, column 45 in selectseq_literal_body
    4. Line 13, column 9 to line 13, column 38 in selectseq_literal_body
---*)
