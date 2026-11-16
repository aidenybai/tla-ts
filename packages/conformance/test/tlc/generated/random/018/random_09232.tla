(*---
description: Evaluates a random seq expression, seed 262, number 9232.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09232 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF (\A b14326 \in {2147483647, -1} : (TRUE => FALSE)) THEN Len(Append(<<1>>, 0)) ELSE ([<<5, 6>> EXCEPT ![2] = 0])[(2147483647 \div -1)], LET b14327 == Head([<<1, 2>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]]) IN Len(SubSeq(<<1, 2>>, b14327, 2147483647))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 145 to line 14, col 148 of module random_09232 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 134.
    | Expression starting at line 14, column 134.
    | ExtendableExpr starting at line 14, column 133.
    | Expression starting at line 14, column 133.
    | Some [] Form starting at line 14, column 132.
    | Fatal errors while parsing TLA+ spec in file random_09232
    | In module random_09232
    | Could not parse module random_09232 from file random_09232.tla
    | *** Errors: 1
    | In module random_09232
    | Could not parse module random_09232 from file random_09232.tla
    3002:1 Parsing or semantic analysis failed.
---*)
