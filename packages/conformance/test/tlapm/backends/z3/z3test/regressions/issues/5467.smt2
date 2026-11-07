(*---
description: z3test's regression regressions/issues/5467.smt2.
ref: regressions/issues/5467.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-fun a () String)
(declare-fun b () Int)
(assert (str.contains a "AAAAAAAAABBBBBBBC"))
(assert (= (str.len a) (- b (abs (str.len a)))))
(assert (not (= (str.indexof a "BBBBBBB" (- b 30)) (- 1))))
(check-sat)
(exit)

;(set-info :status sat)
(set-option :rewriter.eq2ineq true)
(declare-fun a () String)
(declare-fun x () Int)
(assert (str.contains a "Hello and goodbye!"))
(assert (= (str.len a) x))
(assert (not (= (str.indexof a "goodbye" (- (+ x x) 30)) (- 1))))
(check-sat)
(exit)
(reset)



(set-info :status unsat)
(declare-fun a () String)
(declare-fun b () String)
(assert (str.in_re a (re.* (str.to_re "A"))))
(assert (str.in_re (str.++ a "B") (re.* (str.to_re (str.substr b 0 (str.len a))))))
(check-sat)
(get-model)
(reset)

(set-info :status unsat)
(declare-fun a () String)
(assert (str.in_re (str.++ a "AA") (re.++ (re.* (str.to_re "B")) (str.to_re (str.substr (str.++ "B" a) (str.len a) (str.len a))))))
(check-sat)
(reset)

(set-info :status sat)
(declare-fun a () String)
(declare-fun b () Int)
(assert (str.contains a "AAAAAAAAABBBBBBBC"))
(assert (= (str.len a) (- b (abs (str.len a)))))
(assert (not (= (str.indexof a "BBBBBBB" (- b 30)) (- 1))))
(check-sat)
(reset)
(set-info :status unknown)


(declare-fun a () String)
(assert (str.in_re a (re.++ (re.opt (str.to_re "A")) (str.to_re "A") (str.to_re "A") (str.to_re "A"))))
(check-sat)
(reset)

(declare-fun a () String)
(declare-fun b () String)
(assert (= b "A"))
(assert (not (str.in_re (str.++ a "BA" b) (re.++ (re.* (str.to_re "A")) (str.to_re "B") (str.to_re "A") (str.to_re "A")))))
(check-sat)
(get-model)
(reset)

(set-info :status sat)
(declare-fun a () String)
(assert (str.in_re a (re.++ (re.opt (str.to_re "A")) (str.to_re "A") (str.to_re "A") (str.to_re "A"))))
(check-sat)
(reset)

(set-info :status unknown)
(declare-fun str6 () String)
(assert (str.in_re str6 (re.++ re.all (str.to_re "qk") (str.to_re "C"))))
(reset)

(declare-fun a () String)
(declare-fun b () String)
(assert (= b "A"))
(assert (not (str.in_re (str.++ a "BA" b) (re.++ (re.* (str.to_re "A")) (str.to_re "B") (str.to_re "A") (str.to_re "A")))))
(check-sat)
(get-model)
(reset)

(declare-fun a () Int)
(declare-fun b () String)
(assert (str.in_re (str.++ b "A") (re.* (str.to_re (str.substr b 1 a)))))
(check-sat)
(get-model)
(reset)


(declare-fun a () String)
(declare-fun b () Int)
(declare-fun c () Int)
(assert (str.in_re (str.++ a "A") (re.* (str.to_re (str.substr "B" b c)))))
(check-sat)
(reset)

(declare-fun a () String)
(assert (str.in_re a (re.++ (re.opt (str.to_re "A")) (str.to_re "A") (str.to_re "A") (str.to_re "A"))))
(check-sat)
(reset)
(exit)

(declare-fun z () (Seq Bool))
(assert (not (seq.nth (as seq.empty (Seq Bool)) 0)))
(assert (seq.nth (seq.extract z 1 (- (seq.len z) 1)) 0))
(check-sat)
(reset)

(set-option :rewriter.eq2ineq true)
(declare-fun z () Int)
(declare-fun b () (Seq Int))
(declare-fun y () Int)
(declare-fun a () (Seq Int))
(declare-fun x () Int)
(assert (and (= 1 z) (distinct (seq.nth b x) (seq.nth a z)) (= (seq.nth b y) (seq.nth b 1))))
(assert (> x 0))
(assert (> z 0))
(check-sat)
(reset)

(set-info :status sat)
(declare-fun s () String)
(declare-fun i () Int)
(assert (str.contains s "aaaaaaa"))
(assert (= (str.len s) i))
(assert (= (not (= (str.indexof s "aaaaaaa" (- (+ i i) 30)) (- 1))) (str.contains s "bbbbbbbbbbaaaaaaab") (> i 0)))
(check-sat)
(reset)

(declare-fun a () String)
(check-sat
 (not
  (str.in_re (str.++ "auzb" a)
   (re.++
    (re.*
     (re.union (re.opt (str.to_re "b"))
      (re.union
       (re.++ (str.to_re "b")
        (re.union (str.to_re "zb") (str.to_re "z") (str.to_re "a")))
       (str.to_re a))))
    (str.to_re "b")))))
(assert (<= (str.len a) 0))
(check-sat)
(reset)

(set-option :rewriter.pull_cheap_ite true)
(set-option :smt.arith.bprop_on_pivoted_rows false)

(declare-fun a () String)
(assert (str.contains (str.substr a (+ (str.indexof a "C" 0) 1) (- (str.len a) (+ (str.indexof a "C" 0) 1))) "C"))
(assert (= (ite (= (str.at a (- (str.len a) 1)) "A") 1 0) (+ (str.indexof a "C" 0) 1)))
(assert (not (str.contains (str.substr a (div 1 (ite (= (str.at a 0) "A") 1 0)) (- (+ (str.indexof a "C" 0) 1) (- (str.len a) 1 (ite (= (str.at a 0) "AA") 1 0) (ite (= (str.at a 0) "A") 1 0)))) "B")))
(assert (>= (str.indexof a "C" 0) (ite (= (str.at a 0) "B") 1 0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
