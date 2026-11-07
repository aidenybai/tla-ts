(*---
description: Evaluates a random bool expression, seed 262, number 4864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[3 EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (0 * 3)] = (Head(<<>>) = Len(<<1>>))) => (SubSeq(Append(<<3, 1, 2>>, 2), (0 + 7), (--1)) \in {([a |-> 1, b |-> TRUE]).a : b7576 \in [<<3, 1, 2>> EXCEPT ![1] = 3]})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 144 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 141.
    | Expression starting at line 14, column 141.
    | Optional Arguments starting at line 14, column 107.
    | Primitive expression starting at line 14, column 101.
    | ExtendableExpr starting at line 14, column 101.
    | Fatal errors while parsing TLA+ spec in file random_04864
    | In module random_04864
    | Could not parse module random_04864 from file random_04864.tla
    | *** Errors: 1
    | In module random_04864
    | Could not parse module random_04864 from file random_04864.tla
    3002:1 Parsing or semantic analysis failed.
---*)
