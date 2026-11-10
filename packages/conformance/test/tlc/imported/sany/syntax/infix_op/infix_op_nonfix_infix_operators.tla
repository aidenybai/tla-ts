(*---
description: Nonfix Infix Operators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_nonfix_infix_operators ----
op == {
  A!B!&(x, y),
  A!B!&&(x, y),
  A!B!\approx(x, y),
  A!B!:=(x, y),
  A!B!\asymp(x, y),
  A!B!\bigcirc(x, y),
  A!B!::=(x, y),
  A!B!\bullet(x, y),
  A!B!\intersect(x, y),
  A!B!\cap(x, y),
  A!B!\cdot(x, y),
  A!B!\o(x, y),
  A!B!\circ(x, y),
  A!B!@@(x, y),
  A!B!\cong(x, y),
  A!B!\union(x, y),
  A!B!\cup(x, y),
  A!B!\div(x, y),
  A!B!$(x, y),
  A!B!$$(x, y),
  A!B!\doteq(x, y),
  A!B!..(x, y),
  A!B!...(x, y),
  A!B!=(x, y),
  A!B!\equiv(x, y),
  A!B!>=(x, y),
  A!B!\geq(x, y),
  A!B!\gg(x, y),
  A!B!>(x, y),
  A!B!##(x, y),
  A!B!<=>(x, y),
  A!B!=>(x, y),
  A!B!\in(x, y),
  A!B!\land(x, y),
  A!B!=|(x, y),
  A!B!~>(x, y),
  A!B!<=(x, y),
  A!B!=<(x, y),
  A!B!\leq(x, y),
  A!B!\ll(x, y),
  A!B!\lor(x, y),
  A!B!-|(x, y),
  A!B!<(x, y),
  A!B!<:(x, y),
  A!B!:>(x, y),
  A!B!-(x, y),
  A!B!--(x, y),
  A!B!%(x, y),
  A!B!%%(x, y),
  A!B!*(x, y),
  A!B!**(x, y),
  A!B!/=(x, y),
  A!B!#(x, y),
  A!B!\notin(x, y),
  A!B!(.)(x, y),
  A!B!\odot(x, y),
  A!B!(-)(x, y),
  A!B!\ominus(x, y),
  A!B!(+)(x, y),
  A!B!\oplus(x, y),
  A!B!(/)(x, y),
  A!B!\oslash(x, y),
  A!B!(\X)(x, y),
  A!B!\otimes(x, y),
  A!B!+(x, y),
  A!B!-+->(x, y),
  A!B!++(x, y),
  A!B!^(x, y),
  A!B!^^(x, y),
  A!B!\prec(x, y),
  A!B!\preceq(x, y),
  A!B!\propto(x, y),
  A!B!??(x, y),
  A!B!|=(x, y),
  A!B!|-(x, y),
  A!B!\(x, y),
  A!B!\sim(x, y),
  A!B!\simeq(x, y),
  A!B!/(x, y),
  A!B!//(x, y),
  A!B!\sqcap(x, y),
  A!B!\sqcup(x, y),
  A!B!\sqsubset(x, y),
  A!B!\sqsubseteq(x, y),
  A!B!\sqsupset(x, y),
  A!B!\sqsupseteq(x, y),
  A!B!\star(x, y),
  A!B!\subset(x, y),
  A!B!\subseteq(x, y),
  A!B!\succ(x, y),
  A!B!\succeq(x, y),
  A!B!\supset(x, y),
  A!B!\supseteq(x, y),
  A!B!\X(x, y),
  A!B!\times(x, y),
  A!B!\uplus(x, y),
  A!B!|(x, y),
  A!B!||(x, y),
  A!B!\wr(x, y)
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 99
    | line 10, col 3 to line 10, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!&'.
    | line 11, col 3 to line 11, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!&&'.
    | line 12, col 3 to line 12, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\approx'.
    | line 13, col 3 to line 13, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!:='.
    | line 14, col 3 to line 14, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\asymp'.
    | line 15, col 3 to line 15, col 14 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\bigcirc'.
    | line 16, col 3 to line 16, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!::='.
    | line 17, col 3 to line 17, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\bullet'.
    | line 18, col 3 to line 18, col 16 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\intersect'.
    | line 19, col 3 to line 19, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\intersect'.
    | line 20, col 3 to line 20, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\cdot'.
    | line 21, col 3 to line 21, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\o'.
    | line 22, col 3 to line 22, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\o'.
    | line 23, col 3 to line 23, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!@@'.
    | line 24, col 3 to line 24, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\cong'.
    | line 25, col 3 to line 25, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\union'.
    | line 26, col 3 to line 26, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\union'.
    | line 27, col 3 to line 27, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\div'.
    | line 28, col 3 to line 28, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!$'.
    | line 29, col 3 to line 29, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!$$'.
    | line 30, col 3 to line 30, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\doteq'.
    | line 31, col 3 to line 31, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!..'.
    | line 32, col 3 to line 32, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!...'.
    | line 33, col 3 to line 33, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!='.
    | line 34, col 3 to line 34, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\equiv'.
    | line 35, col 3 to line 35, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\geq'.
    | line 36, col 3 to line 36, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\geq'.
    | line 37, col 3 to line 37, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\gg'.
    | line 38, col 3 to line 38, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!>'.
    | line 39, col 3 to line 39, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!##'.
    | line 40, col 3 to line 40, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\equiv'.
    | line 41, col 3 to line 41, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!=>'.
    | line 42, col 3 to line 42, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\in'.
    | line 43, col 3 to line 43, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\land'.
    | line 44, col 3 to line 44, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!=|'.
    | line 45, col 3 to line 45, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!~>'.
    | line 46, col 3 to line 46, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\leq'.
    | line 47, col 3 to line 47, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\leq'.
    | line 48, col 3 to line 48, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\leq'.
    | line 49, col 3 to line 49, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\ll'.
    | line 50, col 3 to line 50, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\lor'.
    | line 51, col 3 to line 51, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!-|'.
    | line 52, col 3 to line 52, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!<'.
    | line 53, col 3 to line 53, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!<:'.
    | line 54, col 3 to line 54, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!:>'.
    | line 55, col 3 to line 55, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!-'.
    | line 56, col 3 to line 56, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!--'.
    | line 57, col 3 to line 57, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!%'.
    | line 58, col 3 to line 58, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!%%'.
    | line 59, col 3 to line 59, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!*'.
    | line 60, col 3 to line 60, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!**'.
    | line 61, col 3 to line 61, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!/='.
    | line 62, col 3 to line 62, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!/='.
    | line 63, col 3 to line 63, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\notin'.
    | line 64, col 3 to line 64, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\odot'.
    | line 65, col 3 to line 65, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\odot'.
    | line 66, col 3 to line 66, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\ominus'.
    | line 67, col 3 to line 67, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\ominus'.
    | line 68, col 3 to line 68, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\oplus'.
    | line 69, col 3 to line 69, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\oplus'.
    | line 70, col 3 to line 70, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\oslash'.
    | line 71, col 3 to line 71, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\oslash'.
    | line 72, col 3 to line 72, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\otimes'.
    | line 73, col 3 to line 73, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\otimes'.
    | line 74, col 3 to line 74, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!+'.
    | line 75, col 3 to line 75, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!-+->'.
    | line 76, col 3 to line 76, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!++'.
    | line 77, col 3 to line 77, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!^'.
    | line 78, col 3 to line 78, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!^^'.
    | line 79, col 3 to line 79, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\prec'.
    | line 80, col 3 to line 80, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\preceq'.
    | line 81, col 3 to line 81, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\propto'.
    | line 82, col 3 to line 82, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!??'.
    | line 83, col 3 to line 83, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!|='.
    | line 84, col 3 to line 84, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!|-'.
    | line 85, col 3 to line 85, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\'.
    | line 86, col 3 to line 86, col 10 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sim'.
    | line 87, col 3 to line 87, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\simeq'.
    | line 88, col 3 to line 88, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!/'.
    | line 89, col 3 to line 89, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!//'.
    | line 90, col 3 to line 90, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sqcap'.
    | line 91, col 3 to line 91, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sqcup'.
    | line 92, col 3 to line 92, col 15 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sqsubset'.
    | line 93, col 3 to line 93, col 17 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sqsubseteq'.
    | line 94, col 3 to line 94, col 15 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sqsupset'.
    | line 95, col 3 to line 95, col 17 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\sqsupseteq'.
    | line 96, col 3 to line 96, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\star'.
    | line 97, col 3 to line 97, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\subset'.
    | line 98, col 3 to line 98, col 15 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\subseteq'.
    | line 99, col 3 to line 99, col 11 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\succ'.
    | line 100, col 3 to line 100, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\succeq'.
    | line 101, col 3 to line 101, col 13 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\supset'.
    | line 102, col 3 to line 102, col 15 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\supseteq'.
    | line 103, col 3 to line 103, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\times'.
    | line 104, col 3 to line 104, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\times'.
    | line 105, col 3 to line 105, col 12 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\uplus'.
    | line 106, col 3 to line 106, col 7 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!|'.
    | line 107, col 3 to line 107, col 8 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!||'.
    | line 108, col 3 to line 108, col 9 of module infix_op_nonfix_infix_operators
    | Unknown operator: `A!B!\wr'.
    3002:1 Parsing or semantic analysis failed.
---*)
