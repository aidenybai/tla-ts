(*---
description: z3test's regression regressions/smt2/re.smt2.
ref: regressions/smt2/re.smt2
features:
  - z3test
outcome: any
---*)
(declare-const a String)
(declare-const b String)
(declare-const r (RegEx String))
(declare-const r1 (RegEx String))
(declare-const r2 (RegEx String))

(simplify (not (str.in.re a re.nostr)))
(simplify (str.in.re a re.all))
(simplify (str.in.re "a" (str.to.re "a")))
(simplify (not (str.in.re "a" (str.to.re "ab"))))
(simplify (str.in.re "a" (re.+ (str.to.re "a"))))
(simplify (str.in.re "a" (re.* (str.to.re "a"))))
(simplify (str.in.re "a" (re.opt (str.to.re "a"))))
(simplify (str.in.re "a" (re.union (str.to.re "a") (str.to.re "b"))))
(simplify (not (str.in.re "c" (re.union (str.to.re "a") (str.to.re "b")))))
(echo "algebra")
(simplify (= (= a "") (str.in.re a (re.* re.nostr))))
(simplify (str.in.re a (re.* re.all)))
(simplify (not (str.in.re a (re.+ re.nostr))))
(simplify (str.in.re a (re.+ re.all)))
(simplify (= (= a "") (str.in.re a (re.opt re.nostr))))
(simplify (str.in.re a (re.opt re.all)))
(simplify (= r (re.union re.nostr r)))
(simplify (= r (re.union r re.nostr)))
(simplify (= re.all (re.union re.all r)))
(simplify (= re.all (re.union r re.all)))
(simplify (= r (re.union r r)))
(simplify (= re.nostr (re.++ re.nostr r)))
(simplify (= re.nostr (re.++ r re.nostr)))
(simplify (= r (re.++ r (str.to.re ""))))
(simplify (= r (re.++ (str.to.re "") r)))
(simplify (= r (re.inter r r)))
(simplify (= re.nostr (re.inter re.nostr r)))
(simplify (= re.nostr (re.inter r re.nostr)))
(simplify (= r (re.inter r re.all)))
(simplify (= r (re.inter re.all r)))
(simplify (= (re.+ r) (re.+ (re.+ r))))
(simplify (= (re.* r) (re.* (re.* r))))
(simplify (= (re.* r) (re.* (re.+ r))))
(simplify (= (re.* r) (re.+ (re.* r))))
(simplify (= (str.to.re "") (re.* re.nostr)))
(simplify (= re.nostr (re.+ re.nostr)))
(simplify (= re.all (re.* re.all)))
(simplify (= re.all (re.+ re.all)))
(simplify (= (re.* (re.union r1 r2)) (re.* (re.union (re.* r1) r2))))
(simplify (= (re.* (re.union r1 r2)) (re.* (re.union r1 (re.* r2)))))
(simplify (= (re.* r) (re.* (re.union (str.to.re "") r))))
(simplify (= (re.* r) (re.* (re.opt r))))
(echo "complement")
(simplify (str.in.re "a" (re.complement (str.to.re "b"))))
(simplify (not (str.in.re "a" (re.complement (str.to.re "a")))))
(simplify (str.in.re "a" (re.complement (re.range "b" "d"))))
(simplify (not (str.in.re "c" (re.complement (re.range "b" "d")))))
(simplify (= re.nostr (re.complement re.all)))
(simplify (= re.all (re.complement re.nostr)))
(simplify (= (re.union (re.complement r1) (re.complement r2)) (re.complement (re.inter r1 r2))))
(simplify (= (re.inter (re.complement r1) (re.complement r2)) (re.complement (re.union r1 r2))))

(simplify (str.in.re a (str.to.re "abc")))
(simplify (str.in.re a (re.union (str.to.re "ab") (str.to.re "abc"))))


; test loop with both lower and upper bounds
(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 1 3) (str.to.re "ab"))))
(check-sat)
(pop)

(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 1 3) (str.to.re "ab"))))
(assert (= (str.len a) 2))
(check-sat)
(get-model)
(pop)

(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 1 3) (str.to.re "ab"))))
(assert (= (str.len a) 4))
(check-sat)
(get-model)
(pop)

(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 1 3) (str.to.re "ab"))))
(assert (= (str.len a) 6))
(check-sat)
(get-model)
(pop)

(push)
(set-info :status unsat)
(assert (str.in.re a ((_ re.loop 1 3) (str.to.re "ab"))))
(assert (> (str.len a) 6))
(check-sat)
(pop)

(push)
(set-info :status unsat)
(assert (str.in.re a ((_ re.loop 1 3) (str.to.re "ab"))))
(assert (not (= (str.len a) 6)))
(assert (not (= (str.len a) 4)))
(assert (not (= (str.len a) 2)))
(check-sat)
(pop)

; test loop with just lower bound
(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 2) (str.to.re "ab"))))
(check-sat)
;(get-model)
(pop)

(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 2) (str.to.re "ab"))))
(assert (= (str.len a) 4))
(check-sat)
(get-model)
(pop)

(push)
(set-info :status sat)
(assert (str.in.re a ((_ re.loop 2) (str.to.re "ab"))))
(assert (= (str.len a) 6))
(check-sat)
(get-model)
(pop)

(push)
(set-info :status unsat)
(assert (str.in.re a ((_ re.loop 2) (str.to.re "ab"))))
(assert (= (str.len a) 5))
(check-sat)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    true
    true
    true
    true
    true
    true
    true
    true
    algebra
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    true
    (let ((a!1 (re.++ (re.* r) (re.* (re.++ r (re.* r))))))
      (= (re.++ r (re.* r)) (re.++ r a!1)))
    true
    (= (re.* r) (re.* (re.++ r (re.* r))))
    true
    true
    true
    true
    true
    true
    true
    true
    true
    complement
    true
    true
    true
    true
    true
    true
    true
    true
    (= a "abc")
    (str.in_re a (re.union (str.to_re "ab") (str.to_re "abc")))
    sat
    sat
    (
      (define-fun a () String
        "ab")
      (define-fun r2 () (RegEx String)
        (str.to_re ""))
      (define-fun b () String
        "")
      (define-fun r1 () (RegEx String)
        (str.to_re ""))
      (define-fun r () (RegEx String)
        (str.to_re ""))
    )
    sat
    (
      (define-fun a () String
        "abab")
      (define-fun r2 () (RegEx String)
        (str.to_re ""))
      (define-fun b () String
        "")
      (define-fun r1 () (RegEx String)
        (str.to_re ""))
      (define-fun r () (RegEx String)
        (str.to_re ""))
    )
    sat
    (
      (define-fun a () String
        "ababab")
      (define-fun r2 () (RegEx String)
        (str.to_re ""))
      (define-fun b () String
        "")
      (define-fun r1 () (RegEx String)
        (str.to_re ""))
      (define-fun r () (RegEx String)
        (str.to_re ""))
    )
    unsat
    unsat
    sat
    sat
    (
      (define-fun a () String
        "abab")
      (define-fun r2 () (RegEx String)
        (str.to_re ""))
      (define-fun b () String
        "")
      (define-fun r1 () (RegEx String)
        (str.to_re ""))
      (define-fun r () (RegEx String)
        (str.to_re ""))
    )
    sat
    (
      (define-fun a () String
        "ababab")
      (define-fun r2 () (RegEx String)
        (str.to_re ""))
      (define-fun b () String
        "")
      (define-fun r1 () (RegEx String)
        (str.to_re ""))
      (define-fun r () (RegEx String)
        (str.to_re ""))
    )
    unsat
---*)
