(*---
description: Evaluates a random record expression, seed 262, number 9436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + (2 * 1)] EXCEPT !.a = ([(1 :> 2) EXCEPT ![2147483647] = 2])[(1 \div -1)]] EXCEPT !.a = CASE (SubSeq(<<1, 2>>, -1, 1) = [{} EXCEPT ![7] = (1 :> 2)]) -> (CHOOSE b14647 \in ({1, 2} \ Nat) : (TRUE => TRUE)) [] OTHER -> (SubSeq(<<1, 2>>, 0, 7) % ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 142 to line 14, col 145 of module random_09436 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 140.
    | Expression starting at line 14, column 140.
    | ExtendableExpr starting at line 14, column 139.
    | Expression starting at line 14, column 139.
    | Some [] Form starting at line 14, column 138.
    | Fatal errors while parsing TLA+ spec in file random_09436
    | In module random_09436
    | Could not parse module random_09436 from file random_09436.tla
    | *** Errors: 1
    | In module random_09436
    | Could not parse module random_09436 from file random_09436.tla
    3002:1 Parsing or semantic analysis failed.
---*)
