/**
 * @jest-environment jsdom
 */

import { fireEvent,screen,waitFor } from "@testing-library/dom"
import { ROUTES,ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import mockStore from "../__mocks__/store"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
})


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.value).toMatch("active-icon")
    })
    test("Then, a form should be display and all the form input should be render correctly", async () => {
      document.body.innerHTML = NewBillUI()
      await waitFor(() => screen.getByTestId('form-new-bill'))

      const formNewBill = screen.getByTestId('form-new-bill')
      const expenseTypeField = screen.getByTestId('expense-type')
      const expenseNameField = screen.getByTestId('expense-name')
      const datepickerField = screen.getByTestId('datepicker')
      const amountField = screen.getByTestId('amount')
      const vatField = screen.getByTestId('vat')
      const pctField = screen.getByTestId('pct')
      const commentaryField = screen.getByTestId('commentary')
      const fileField = screen.getByTestId('file')
      const submitButton = screen.getByText('Envoyer')

      expect(formNewBill).toBeTruthy()
      expect(expenseTypeField).toBeTruthy()
      expect(expenseNameField).toBeTruthy()
      expect(datepickerField).toBeTruthy()
      expect(amountField).toBeTruthy()
      expect(vatField).toBeTruthy()
      expect(pctField).toBeTruthy()
      expect(commentaryField).toBeTruthy()
      expect(fileField).toBeTruthy()
      expect(submitButton).toBeTruthy()
    })
    describe("And user fill the form", () => {
      describe("And upload an image with the correct format", () => {
        test("Then, the handleChangeFile function should be called and the name of image should be display in the input", async () => {
          document.body.innerHTML = NewBillUI()
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
          }
          const store = mockStore
          const newBill = new NewBill({ document, onNavigate, store, localStorage })
          const handleChangeFile = jest.fn(() => newBill.handleChangeFile)
          const file = screen.getByTestId("file")
          file.addEventListener("change", handleChangeFile)
          await fireEvent.change(file, {
            target: {
              files: [new File(["file-test.png"], "file-test.png", { type: "image/png" })],
            },
          })
          expect(handleChangeFile).toHaveBeenCalled()
          expect(file.classList.value).toMatch("blue-border")
          expect(file.files[0].name).toBe("file-test.png")
          expect(file.files[0].type).toBe("image/png")
          expect(newBill.fileName).toBe("file-test.png")
          expect(newBill.formData).not.toBe(null)
        })
      })
      describe("And upload an image with an incorrect format", () => {
        test("Then, the warning message should be display", async () => {
          document.body.innerHTML = NewBillUI()
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
          }
          const store = null
          const newBill = new NewBill({ document, onNavigate, store, localStorage })
          const handleChangeFile = jest.fn(() => newBill.handleChangeFile)
          const file = screen.getByTestId("file")
          file.addEventListener("change", handleChangeFile)
          await fireEvent.change(file, {
            target: {
              files: [new File(["file-test.gif"], "file-test.gif", { type: "image/gif" })],
            },
          })
          expect(handleChangeFile).toHaveBeenCalled()
          expect(file.classList.value).toMatch("is-invalid")
          expect(file.value).toBe("")
          expect(newBill.fileUrl).toBeNull()
        })
      })
      test("Then the handleSubmit function should be called on the form submit", () => {
        document.body.innerHTML = NewBillUI()
        const onNavigate = (pathname) => { 
          document.body.innerHTML = ROUTES({ pathname }) 
        }
        const newBill = new NewBill({ document, onNavigate, mockStore, localStorage })  
        const form = screen.getByTestId("form-new-bill")
        const handleSubmit = jest.fn(newBill.handleSubmit)
        form.addEventListener("submit", handleSubmit)
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
      })
    })
  })

  //POST test
  describe("When I post a new bill", () => {
    test("Add a bill from mock API POST", async () => {
      const postSpy = jest.spyOn(mockStore, "bills")
      const bill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      }
      const postBills = await mockStore.bills().update(bill)
			expect(postSpy).toHaveBeenCalledTimes(1)
			expect(postBills.id).toBe("47qAXb6fIm2zOKkLzMro")
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        document.body.innerHTML = NewBillUI()
      })
      test("add bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          Promise.reject(new Error('Erreur 404'))
        })
        document.body.innerHTML = BillsUI({ error: 'Erreur 404' })
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("add messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          Promise.reject(new Error("Erreur 500"))
        })
        document.body.innerHTML = BillsUI({ error: 'Erreur 500' })
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})