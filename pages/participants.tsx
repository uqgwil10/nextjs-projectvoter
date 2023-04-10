import Layout from "@/components/Layout";
import { WithAuth } from "@/components/WithAuth";
import usePostUtility from "@/uilities/client/usePostUtility";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { ProgramsResponse } from "./programs";
import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PhotoIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import classNames from "@/uilities/insertClasses";
import uploadImage from "@/pages/api/uploadImage";
import { cloudflareImageBaseURL } from "./config";

interface SwitchProgramFormData {
	programId: number;
}

interface ParticipantFormFormData {
	name: string;
	summary: string;
	programId: number;
	image?: FileList;
}

function Participants() {
	const {
		data: programsData,
		error: programsError,
		mutate: mutatePrograms,
	} = useSWR<ProgramsResponse>("api/programs");

	const {
		register: registerParticipant,
		handleSubmit: handleParticipantSubmit,
		setValue: setParticipantSetValue,
		reset: resetParticipantForm,
	} = useForm<ParticipantFormFormData>();

	const { register, handleSubmit, setValue } =
		useForm<SwitchProgramFormData>();

	const [switchProgram, { data, isLoading, error }] =
		usePostUtility("/api/user");

	useEffect(() => {
		if (data?.ok && !isLoading) {
			mutatePrograms();
		}
	}, [data, mutatePrograms, isLoading, setValue]);

	const [
		postParticipant,
		{
			data: participantData,
			isLoading: participantLoading,
			error: participantError,
		},
	] = usePostUtility("/api/participants");

	useEffect(() => {
		if (participantData?.ok && !participantLoading) {
			mutatePrograms();
			resetParticipantForm();
			setPhoto(undefined);
			setOpen(false);
		}
	}, [
		participantData,
		mutatePrograms,
		participantLoading,
		resetParticipantForm,
	]);

	const [photo, setPhoto] = useState<File | undefined>(undefined);
	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event?.target?.files[0]) {
			setPhoto(event?.target?.files[0]);
		}
	};

	const [open, setOpen] = useState(false);

	const onValid = (formData: SwitchProgramFormData) => {
		if (isLoading) {
			return;
		}
		switchProgram({ body: formData, method: "PATCH" });
	};
	const [isUploading, setIsUploading] = useState(false);

	const onValidParticipantSubmit = async ({
		name,
		summary,
		image,
		programId,
	}: ParticipantFormFormData) => {
		if (participantLoading || isUploading) {
			return;
		}
		let imageId;
		if (image?.length && image.length > 0) {
			setIsUploading(true);
			imageId = await uploadImage(image[0]);
			setIsUploading(false);
		}
		postParticipant({ body: { name, summary, image: imageId, programId } });
	};

	return (
		<Layout>
			<div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
						Participants Page
					</h2>
				</div>
				<div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mt-3">
					<form onSubmit={handleSubmit(onValid)}>
						<label
							htmlFor="program"
							className="block text-sm font-medium leading-6 text-gray-900 text-center"
						>
							Currently Selected Program:
						</label>
						<div className="flex items-center mt-3">
							{programsData ? (
								<select
									{...register("programId")}
									defaultValue={
										programsData.currentProgram.id
									}
									id="program"
									className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 h-9"
								>
									{programsData?.programs?.map((program) => {
										return (
											<option
												key={program.id}
												value={program.id}
											>
												{program.programName}
											</option>
										);
									})}
								</select>
							) : (
								<div>loading...</div>
							)}

							<button className="rounded bg-green-600 px-2 text-xs font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 h-9 sm:ml-1">
								View
							</button>
						</div>
					</form>
				</div>
				<div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
					<button
						type="submit"
						className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 my-3"
						onClick={() => setOpen(true)}
					>
						Add a participant
					</button>
				</div>
				<div className="mt-8 flow-root">
					<div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
						<div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
							<div className="px-6 sm:px-0 sm:overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
								<table className="divide-y divide-gray-300">
									<thead className="bg-gray-50">
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
											>
												Participant
											</th>
											<th
												scope="col"
												className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
											>
												Summary
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 bg-white">
										{programsData?.currentProgram?.participants?.map(
											(participant) => (
												<tr key={participant.id}>
													<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
														{participant.name}
													</td>
													<td className="whitespace-normal px-3 py-4 text-sm text-gray-500">
														<div className="sm:w-36 sm:h-36 w-full aspect-square relative float-left mr-5">
															<Image
																src={`${cloudflareImageBaseURL}/${participant.image}/avatar`}
																className="object-scale-down"
																fill
																alt={`${participant.name} Image`}
															></Image>
														</div>
														<div>
															{
																participant.summary
															}
															Minim commodo duis
															ex reprehenderit
															cillum in commodo
															dolore consectetur.
															Eu commodo dolor
															ullamco tempor
															nostrud eu veniam
															velit eu nulla. In
															cupidatat incididunt
															velit eiusmod dolor
															eu quis. Ut
															adipisicing ullamco
															id ut excepteur
															commodo officia ex
															et duis.
														</div>
													</td>
												</tr>
											)
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
			{open && (
				<Transition.Root show={open} as={Fragment}>
					<Dialog
						as="div"
						className="relative z-10"
						onClose={setOpen}
					>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
						</Transition.Child>

						<div className="fixed inset-0 z-10 overflow-y-auto">
							<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
								<Transition.Child
									as={Fragment}
									enter="ease-out duration-300"
									enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
									enterTo="opacity-100 translate-y-0 sm:scale-100"
									leave="ease-in duration-200"
									leaveFrom="opacity-100 translate-y-0 sm:scale-100"
									leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
								>
									<Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
										<form
											className="space-y-12 sm:space-y-16"
											onSubmit={handleParticipantSubmit(
												onValidParticipantSubmit
											)}
										>
											<div>
												<h2 className="text-base font-semibold leading-7 text-gray-900">
													Add a participant
												</h2>
												<p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
													This will add a participant
													to the currently selected
													program,{" "}
													{
														programsData
															?.currentProgram
															?.programName
													}
													.
												</p>

												<div className="mt-2 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
													<div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
														<label
															htmlFor="name"
															className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
														>
															Participant Name
														</label>
														<div className="mt-2 sm:col-span-2 sm:mt-0">
															<div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
																<input
																	{...registerParticipant(
																		"name",
																		{
																			required:
																				true,
																		}
																	)}
																	type="text"
																	className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
																/>
															</div>
														</div>
													</div>

													<div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
														<label
															htmlFor="summary"
															className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
														>
															Participant Summary
														</label>
														<div className="mt-2 sm:col-span-2 sm:mt-0">
															<textarea
																{...registerParticipant(
																	"summary",
																	{
																		required:
																			true,
																	}
																)}
																rows={3}
																className="block w-full max-w-2xl rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
																defaultValue={
																	""
																}
															/>
															<p className="mt-3 text-sm leading-6 text-gray-600">
																Write a few
																sentences about
																this
																participant.
															</p>
														</div>
													</div>

													<div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6 hidden">
														<label
															htmlFor="programId"
															className="block text-sm font-medium leading-6 text-gray-900"
														>
															Program
														</label>
														<div className="mt-2 sm:col-span-2 sm:mt-0">
															<select
																disabled
																className="bg-slate-300"
															>
																<option>
																	{
																		programsData
																			?.currentProgram
																			?.programName
																	}
																</option>
															</select>
															<input
																{...registerParticipant(
																	"programId"
																)}
																className="hidden"
																value={
																	programsData
																		?.currentProgram
																		?.id
																}
															></input>
														</div>
													</div>

													<div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
														<label
															htmlFor="image"
															className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
														>
															Participant Photo
														</label>
														<div className="mt-2 sm:col-span-2 sm:mt-0">
															<div className="flex max-w-2xl justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
																<div className="text-center">
																	<PhotoIcon
																		className="mx-auto h-12 w-12 text-gray-300"
																		aria-hidden="true"
																	/>
																	<div className="mt-4 flex text-sm leading-6 text-gray-600">
																		<label
																			htmlFor="image"
																			className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
																		>
																			<span>
																				Upload
																				a
																				file
																			</span>
																			<input
																				{...registerParticipant(
																					"image"
																				)}
																				id="image"
																				type="file"
																				accept="image/png, image/jpeg, image/gif, image/jpg"
																				className="sr-only"
																				onChange={
																					handleImageChange
																				}
																			/>
																		</label>
																		<p className="pl-1">
																			or
																			drag
																			and
																			drop
																		</p>
																	</div>
																	<p className="text-xs leading-5 text-gray-600">
																		PNG,
																		JPG, GIF
																		up to
																		10MB
																	</p>
																</div>
															</div>
															{photo && (
																<div className="sm:w-32 sm:h-32 relative border w-24 h-24">
																	<Image
																		src={URL.createObjectURL(
																			photo
																		)}
																		alt="Participant Photo"
																		className="object-scale-down w-full h-full"
																		fill
																	></Image>
																</div>
															)}
														</div>
													</div>
													<div className="mt-5 sm:mt-6">
														<button
															type="submit"
															className={classNames(
																"inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
																isLoading ||
																	isUploading
																	? "bg-slate-600 hover:bg-slate-500 focus-visible:outline-slate-600"
																	: ""
															)}
															disabled={
																isLoading ||
																isUploading
															}
														>
															{isLoading ||
															isUploading
																? "Please Wait"
																: "Add a Participant"}
														</button>
													</div>
												</div>
											</div>
										</form>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition.Root>
			)}
		</Layout>
	);
}

export default WithAuth(Participants);
