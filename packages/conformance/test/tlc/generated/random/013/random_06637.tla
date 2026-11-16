(*---
description: Evaluates a random seq expression, seed 262, number 6637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append((Tail(<<3, 1, 2>>) \o SubSeq(<<>>, 1, 0)), ((--1) % (7 % 3))) \o Tail((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 71 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 68.
    | Expression starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | Optional Arguments starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_06637
    | In module random_06637
    | Could not parse module random_06637 from file random_06637.tla
    | *** Errors: 1
    | In module random_06637
    | Could not parse module random_06637 from file random_06637.tla
    3002:1 Parsing or semantic analysis failed.
---*)
